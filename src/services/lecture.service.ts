// src/services/lecture.service.ts

import { supabase } from '@/src/lib/supabase';
import { uploadToCloudinary } from '@/src/lib/cloudinary';
import { Lecture, LectureFormData } from '@/src/types/lectures';
import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { sendPushNotification } from '../lib/notifications';

class LectureService {
    /**
     * Fetch all lectures with optional filters
     */
    async fetchLectures(filters?: {
        classId?: string;
        subjectId?: string;
        userId?: string;
    }) {
        try {
            let query = supabase
                .from('lectures')
                .select(`
          *,
          classes (name),
          subjects (name),
          profiles (full_name)
        `)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (filters?.classId) {
                query = query.eq('class_id', filters.classId);
            }
            if (filters?.subjectId) {
                query = query.eq('subject_id', filters.subjectId);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Add view/download status if userId provided
            if (data && filters?.userId) {
                const enhancedLectures = await this.enhanceLecturesWithViewStatus(
                    data,
                    filters.userId
                );
                return enhancedLectures;
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching lectures:', error);
            throw error;
        }
    }

    /**
     * Upload a new lecture
     */
    async uploadLecture(formData: LectureFormData, uploaderId: string) {
        try {
            // Upload file to Cloudinary
            const fileUrl = await uploadToCloudinary(formData.file);

            // Create lecture record
            const { data: lecture, error } = await supabase
                .from('lectures')
                .insert({
                    title: formData.title.trim(),
                    description: formData.description?.trim() || null,
                    file_url: fileUrl,
                    file_name: formData.file.name,
                    file_type: formData.file.mimeType || 'application/pdf',
                    file_size: formData.file.size || null,
                    youtube_link: formData.youtube_link?.trim() || null,
                    class_id: formData.class_id,
                    subject_id: formData.subject_id,
                    uploaded_by: uploaderId,
                    is_active: true,
                })
                .select()
                .single();

            if (error) throw error;

            // Create access records
            await this.createAccessRecords(
                lecture.id,
                formData,
                uploaderId
            );

            const { data: students, error: studentError } = await supabase
                .from('students')
                .select('id')
                .eq('class_id', formData.class_id);

            if (studentError) {
                console.error('Error fetching students for lecture notification:', studentError);
                return lecture;
            }

            if (!students || students.length === 0) {
                console.warn('No students found for class:', formData.class_id);
                return lecture;
            }

            // 5️⃣ Create a notification for lecture upload
            const { data: notification, error: notifError } = await supabase
                .from('notifications')
                .insert([
                    {
                        type: 'lecture_added',
                        title: `${formData.title} Uploaded`,
                        message: `A new lecture has been uploaded for your class. Check it out!`,
                        entity_type: 'lecture',
                        entity_id: lecture.id,
                        created_by: uploaderId,
                        target_type: 'students',
                        target_id: formData.class_id,
                        priority: 'medium',
                    },
                ])
                .select('id')
                .single();

            if (notifError) {
                console.error('Error creating lecture notification:', notifError);
                return lecture;
            }

            // 6️⃣ Add all class students as recipients
            const recipientRows = students.map((s) => ({
                notification_id: notification.id,
                user_id: s.id,
                is_read: false,
                is_deleted: false,
            }));

            const { error: recipientError } = await supabase
                .from('notification_recipients')
                .insert(recipientRows);

            if (recipientError) {
                console.error('Error adding lecture notification recipients:', recipientError);
            } else {
                console.log(`Lecture notification sent to ${students.length} students`);
            }

            // 7️⃣ SEND PUSH NOTIFICATIONS (like fee reminder)
        console.log(`📱 [LECTURE_UPLOAD] Sending push notifications to ${students.length} students...`);
        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            try {
                console.log(`📤 [LECTURE_UPLOAD] Sending to student ${i + 1}/${students.length}: ${student.full_name}`);

                await sendPushNotification({
                    userId: student.id,
                    title: `🎥 New Lecture Uploaded`,
                    body: `The lecture "${formData.title}" has been uploaded. Check it now!`,
                    data: {
                        type: 'lecture_added',
                        notificationId: notification.id,
                        lectureId: lecture.id,
                        classId: formData.class_id,
                        subjectId: formData.subject_id,
                        studentId: student.id,
                        studentName: student.full_name,
                        timestamp: new Date().toISOString(),
                    },
                });

                console.log(`✅ [LECTURE_UPLOAD] Push sent to student ${i + 1}: ${student.full_name}`);
                sentCount++;
            } catch (pushError) {
                console.error(`❌ [LECTURE_UPLOAD] Failed to send push to ${student.full_name}:`, pushError);
                failedCount++;
                continue;
            }
        }

            return lecture;
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    }

    /**
     * Create access records for a lecture
     */
    private async createAccessRecords(
        lectureId: string,
        formData: LectureFormData,
        grantedBy: string
    ) {
        if (formData.access_type === 'class') {
            // Grant access to entire class
            await supabase.from('lecture_access').insert({
                lecture_id: lectureId,
                class_id: formData.class_id,
                access_type: 'class',
                granted_by: grantedBy,
            });
        } else {
            // Grant access to selected students
            const accessRecords = formData.selected_students.map(studentId => ({
                lecture_id: lectureId,
                user_id: studentId,
                access_type: 'individual' as const,
                granted_by: grantedBy,
            }));

            if (accessRecords.length > 0) {
                await supabase.from('lecture_access').insert(accessRecords);
            }
        }
    }

    /**
     * Track lecture view or download
     */
    async trackInteraction(
        lectureId: string,
        userId: string,
        type: 'view' | 'download'
    ) {
        try {
            await supabase.from('lecture_views').insert({
                lecture_id: lectureId,
                user_id: userId,
                view_type: type,
                viewed_at: new Date().toISOString(),
            });
        } catch (error) {
            console.error('Error tracking interaction:', error);
        }
    }

    /**
     * Open lecture file
     */
    async viewLecture(lecture: Lecture, userId: string) {
        await this.trackInteraction(lecture.id, userId, 'view');
        await Linking.openURL(lecture.file_url);
    }

    /**
     * Open YouTube link
     */
    async openYouTubeLink(youtubeLink: string) {
        try {
            // Clean up the YouTube link
            let url = youtubeLink.trim();

            // Add https:// if not present
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            // Try to open in YouTube app first, fallback to browser
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                throw new Error('Invalid YouTube URL');
            }
        } catch (error) {
            console.error('Error opening YouTube link:', error);
            throw error;
        }
    }

    /**
     * Download lecture file
     */
    async downloadLecture(lecture: Lecture, userId: string) {
        await this.trackInteraction(lecture.id, userId, 'download');

        const fileUri = FileSystem.documentDirectory + lecture.file_name;
        const downloadResult = await FileSystem.downloadAsync(
            lecture.file_url,
            fileUri
        );

        if (downloadResult.status === 200) {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadResult.uri);
            }
            return downloadResult.uri;
        }

        throw new Error('Download failed');
    }

    /**
     * Share lecture
     */
    async shareLecture(lecture: Lecture) {
        const message = `📚 ${lecture.title}\n\n` +
            `Subject: ${lecture.subjects?.name || 'N/A'}\n` +
            `Class: ${lecture.classes?.name || 'N/A'}\n` +
            `${lecture.description ? `\n${lecture.description}\n` : ''}` +
            `${lecture.youtube_link ? `\n🎥 YouTube: ${lecture.youtube_link}\n` : ''}` +
            `\n📎 File: ${lecture.file_url}`;

        await Sharing.shareAsync(lecture.file_url, {
            dialogTitle: lecture.title,
            mimeType: lecture.file_type,
        }).catch(() => {
            // Fallback to share API if file sharing fails
            return Sharing.shareAsync(message);
        });
    }

    /**
     * Enhance lectures with view/download status
     */
    private async enhanceLecturesWithViewStatus(
        lectures: Lecture[],
        userId: string
    ): Promise<Lecture[]> {
        const lectureIds = lectures.map(l => l.id);

        const { data: viewData } = await supabase
            .from('lecture_views')
            .select('lecture_id, view_type')
            .in('lecture_id', lectureIds)
            .eq('user_id', userId);

        const viewMap = new Map();
        const downloadMap = new Map();

        viewData?.forEach(view => {
            if (view.view_type === 'view') {
                viewMap.set(view.lecture_id, true);
            } else if (view.view_type === 'download') {
                downloadMap.set(view.lecture_id, true);
            }
        });

        return lectures.map(lecture => ({
            ...lecture,
            has_viewed: viewMap.has(lecture.id),
            has_downloaded: downloadMap.has(lecture.id),
        }));
    }

    /**
     * Fetch classes for a teacher or all classes
     */
    async fetchClasses(teacherId?: string) {
        let query = supabase.from('classes').select('*').order('name');

        if (teacherId) {
            query = query.eq('teacher_id', teacherId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data || [];
    }

    /**
     * Fetch subjects for a class
     */
    async fetchClassSubjects(classId: string) {
        // Step 1: get subject_ids
        const { data: mapping, error } = await supabase
            .from('classes_subjects')
            .select('subject_id')
            .eq('class_id', classId)
            .eq('is_active', true);

        if (error) throw error;
        if (!mapping || mapping.length === 0) return [];

        const subjectIds = mapping.map(m => m.subject_id);


        // Step 2: fetch subjects by id
        const { data: subjects, error: subjectError } = await supabase
            .from('subjects')
            .select('id, name')  // only what you need
            .in('id', subjectIds);

        if (subjectError) throw subjectError;


        return subjects || [];
    }




    /**
     * Fetch students in a class
     */
    async fetchClassStudents(classId: string) {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('id, class_id') // keep it simple
                .eq('class_id', classId)
                .eq('is_active', true);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error("Error fetching students:", err);
            return []; // don’t block subjects
        }
    }

}

export const lectureService = new LectureService();