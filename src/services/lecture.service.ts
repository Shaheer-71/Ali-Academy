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
     * Fetch lectures based on user enrollment
     */
    async fetchLectures(filters?: {
        classId?: string;
        subjectId?: string;
        userId?: string;
        role?: string;
    }) {
        try {
            const userId = filters?.userId;
            const role = filters?.role;

            if (!userId) {
                throw new Error('User ID is required');
            }

            if (!role) {
                throw new Error('User role is required');
            }

            console.log(`🔍 Fetching lectures for ${role}:`, userId);

            if (role === 'teacher') {
                // ✅ For teachers, get from teacher_subject_enrollments
                const { data: enrollments, error: enrollmentError } = await supabase
                    .from('teacher_subject_enrollments')
                    .select('class_id, subject_id')
                    .eq('teacher_id', userId)
                    .eq('is_active', true);

                if (enrollmentError) {
                    console.warn('Enrollments fetch error:', enrollmentError);
                    throw new Error('Failed to fetch enrollments: ' + enrollmentError.message);
                }

                if (!enrollments || enrollments.length === 0) {
                    console.log('No enrollments found for teacher');
                    return [];
                }

                const classIds = [...new Set(enrollments.map(e => e.class_id))];
                const subjectIds = [...new Set(enrollments.map(e => e.subject_id))];

                console.log(`📚 Teacher class IDs:`, classIds);
                console.log(`📚 Teacher subject IDs:`, subjectIds);

                let query = supabase
                    .from('lectures')
                    .select(`
                        *,
                        classes (name),
                        subjects (name),
                        profiles (full_name)
                    `)
                    .eq('is_active', true)
                    .in('class_id', classIds)
                    .in('subject_id', subjectIds)
                    .order('created_at', { ascending: false });

                if (filters?.classId) {
                    query = query.eq('class_id', filters.classId);
                }
                if (filters?.subjectId) {
                    query = query.eq('subject_id', filters.subjectId);
                }

                const { data, error } = await query;
                if (error) throw error;

                console.log(`✅ Fetched ${data?.length || 0} lectures`);

                if (data && userId) {
                    return await this.enhanceLecturesWithViewStatus(data, userId);
                }

                return data || [];
            } else if (role === 'student') {
                // ✅ For students, get from student_subject_enrollments
                const { data: enrollments, error: enrollmentError } = await supabase
                    .from('student_subject_enrollments')
                    .select('class_id, subject_id')
                    .eq('student_id', userId)
                    .eq('is_active', true);

                if (enrollmentError) {
                    console.warn('Enrollments fetch error:', enrollmentError);
                    throw new Error('Failed to fetch enrollments: ' + enrollmentError.message);
                }

                if (!enrollments || enrollments.length === 0) {
                    console.log('No enrollments found for student');
                    return [];
                }

                const classIds = [...new Set(enrollments.map(e => e.class_id))];
                const subjectIds = [...new Set(enrollments.map(e => e.subject_id))];

                console.log(`📚 Student class IDs:`, classIds);
                console.log(`📚 Student subject IDs:`, subjectIds);

                let query = supabase
                    .from('lectures')
                    .select(`
                        *,
                        classes (name),
                        subjects (name),
                        profiles (full_name)
                    `)
                    .eq('is_active', true)
                    .in('class_id', classIds)
                    .in('subject_id', subjectIds)
                    .order('created_at', { ascending: false });

                if (filters?.classId) {
                    query = query.eq('class_id', filters.classId);
                }
                if (filters?.subjectId) {
                    query = query.eq('subject_id', filters.subjectId);
                }

                const { data, error } = await query;
                if (error) throw error;

                console.log(`✅ Fetched ${data?.length || 0} lectures`);

                if (data && userId) {
                    return await this.enhanceLecturesWithViewStatus(data, userId);
                }

                return data || [];
            }

            return [];
        } catch (error) {
            console.warn('Error fetching lectures:', error);
            throw error;
        }
    }

    /**
     * Fetch classes based on enrollment
     */
    async fetchClasses(userId?: string, role?: string) {
        try {
            if (!userId || !role) {
                throw new Error('User ID and role are required');
            }

            console.log(`🔍 Fetching classes for ${role}:`, userId);

            if (role === 'teacher') {
                const { data: enrollments, error: enrollmentError } = await supabase
                    .from('teacher_subject_enrollments')
                    .select('class_id')
                    .eq('teacher_id', userId)
                    .eq('is_active', true);

                if (enrollmentError) throw enrollmentError;

                if (!enrollments || enrollments.length === 0) {
                    return [];
                }

                const classIds = [...new Set(enrollments.map(e => e.class_id))];

                const { data, error } = await supabase
                    .from('classes')
                    .select('*')
                    .in('id', classIds)
                    .order('name');

                if (error) throw error;
                return data || [];
            } else if (role === 'student') {
                const { data: enrollments, error: enrollmentError } = await supabase
                    .from('student_subject_enrollments')
                    .select('class_id')
                    .eq('student_id', userId)
                    .eq('is_active', true);

                if (enrollmentError) throw enrollmentError;

                if (!enrollments || enrollments.length === 0) {
                    return [];
                }

                const classIds = [...new Set(enrollments.map(e => e.class_id))];

                const { data, error } = await supabase
                    .from('classes')
                    .select('*')
                    .in('id', classIds)
                    .order('name');

                if (error) throw error;
                return data || [];
            }

            return [];
        } catch (error) {
            console.warn('Error fetching classes:', error);
            throw error;
        }
    }

    /**
     * Fetch subjects for a class based on enrollment
     */
    async fetchClassSubjects(classId: string, userId?: string, role?: string) {
        try {
            if (!userId || !role) {
                throw new Error('User ID and role are required');
            }

            console.log(`🔍 Fetching subjects for ${role} in class:`, classId);

            if (role === 'teacher') {
                const { data: enrollments, error: enrollmentError } = await supabase
                    .from('teacher_subject_enrollments')
                    .select('subject_id')
                    .eq('teacher_id', userId)
                    .eq('class_id', classId)
                    .eq('is_active', true);

                if (enrollmentError) throw enrollmentError;

                if (!enrollments || enrollments.length === 0) {
                    return [];
                }

                const subjectIds = [...new Set(enrollments.map(e => e.subject_id))];

                const { data: subjects, error: subjectError } = await supabase
                    .from('subjects')
                    .select('id, name, description')
                    .in('id', subjectIds)
                    .eq('is_active', true);

                if (subjectError) throw subjectError;
                return subjects || [];
            } else if (role === 'student') {
                const { data: enrollments, error: enrollmentError } = await supabase
                    .from('student_subject_enrollments')
                    .select('subject_id')
                    .eq('student_id', userId)
                    .eq('class_id', classId)
                    .eq('is_active', true);

                if (enrollmentError) throw enrollmentError;

                if (!enrollments || enrollments.length === 0) {
                    return [];
                }

                const subjectIds = [...new Set(enrollments.map(e => e.subject_id))];

                const { data: subjects, error: subjectError } = await supabase
                    .from('subjects')
                    .select('id, name, description')
                    .in('id', subjectIds)
                    .eq('is_active', true);

                if (subjectError) throw subjectError;
                return subjects || [];
            }

            return [];
        } catch (error) {
            console.warn('Error fetching class subjects:', error);
            return [];
        }
    }

    /**
     * Fetch students enrolled in specific class + subject
     */
    async fetchClassStudents(classId: string, subjectId: string) {
        try {
            console.log('🔍 Fetching students for class + subject:', { classId, subjectId });

            const { data: enrollments, error: enrollmentError } = await supabase
                .from('student_subject_enrollments')
                .select('student_id')
                .eq('class_id', classId)
                .eq('subject_id', subjectId)
                .eq('is_active', true);

            if (enrollmentError) throw enrollmentError;

            if (!enrollments || enrollments.length === 0) {
                return [];
            }

            const studentIds = [...new Set(enrollments.map(e => e.student_id))];

            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', studentIds)
                .eq('role', 'student')
                .order('full_name');

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.warn("Error fetching students:", err);
            return [];
        }
    }

    /**
     * Upload a new lecture
     */
    async uploadLecture(formData: LectureFormData, uploaderId: string) {
        try {
            const fileUrl = await uploadToCloudinary(formData.file);

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

            await this.createAccessRecords(lecture.id, formData, uploaderId);

            // Get students for notifications
            const { data: enrollments } = await supabase
                .from('student_subject_enrollments')
                .select('student_id')
                .eq('class_id', formData.class_id)
                .eq('subject_id', formData.subject_id)
                .eq('is_active', true);

            if (enrollments && enrollments.length > 0) {
                const studentIds = [...new Set(enrollments.map(e => e.student_id))];

                const { data: notification } = await supabase
                    .from('notifications')
                    .insert([{
                        type: 'lecture_added',
                        title: `${formData.title} Uploaded`,
                        message: `A new lecture has been uploaded. Check it out!`,
                        entity_type: 'lecture',
                        entity_id: lecture.id,
                        created_by: uploaderId,
                        target_type: 'students',
                        target_id: formData.class_id,
                        priority: 'medium',
                    }])
                    .select('id')
                    .single();

                if (notification) {
                    const recipientRows = studentIds.map(sid => ({
                        notification_id: notification.id,
                        user_id: sid,
                        is_read: false,
                        is_deleted: false,
                    }));

                    await supabase
                        .from('notification_recipients')
                        .insert(recipientRows);

                    // Send push notifications
                    for (const studentId of studentIds) {
                        try {
                            await sendPushNotification({
                                userId: studentId,
                                title: `🎥 New Lecture Uploaded`,
                                body: `The lecture "${formData.title}" has been uploaded. Check it now!`,
                                data: {
                                    type: 'lecture_added',
                                    notificationId: notification.id,
                                    lectureId: lecture.id,
                                    classId: formData.class_id,
                                    subjectId: formData.subject_id,
                                },
                            });
                        } catch (pushError) {
                            console.warn('Push notification error:', pushError);
                        }
                    }
                }
            }

            return lecture;
        } catch (error) {
            console.warn('Upload error:', error);
            throw error;
        }
    }

    /**
     * ✅ NEW: Update lecture
     */
    async updateLecture(lectureId: string, updates: {
        title?: string;
        description?: string;
        youtube_link?: string;
    }) {
        try {
            const { data, error } = await supabase
                .from('lectures')
                .update({
                    title: updates.title?.trim(),
                    description: updates.description?.trim() || null,
                    youtube_link: updates.youtube_link?.trim() || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', lectureId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.warn('Update error:', error);
            throw error;
        }
    }

    /**
     * ✅ NEW: Delete lecture (soft delete)
     */
    async deleteLecture(lectureId: string) {
        try {
            const { error } = await supabase
                .from('lectures')
                .update({ is_active: false })
                .eq('id', lectureId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.warn('Delete error:', error);
            throw error;
        }
    }

    private async createAccessRecords(
        lectureId: string,
        formData: LectureFormData,
        grantedBy: string
    ) {
        if (formData.access_type === 'class') {
            await supabase.from('lecture_access').insert({
                lecture_id: lectureId,
                class_id: formData.class_id,
                access_type: 'class',
                granted_by: grantedBy,
            });
        } else {
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
            console.warn('Error tracking interaction:', error);
        }
    }

    async viewLecture(lecture: Lecture, userId: string) {
        await this.trackInteraction(lecture.id, userId, 'view');
        await Linking.openURL(lecture.file_url);
    }

    async openYouTubeLink(youtubeLink: string) {
        try {
            let url = youtubeLink.trim();
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                throw new Error('Invalid YouTube URL');
            }
        } catch (error) {
            console.warn('Error opening YouTube link:', error);
            throw error;
        }
    }

    async downloadLecture(lecture: Lecture, userId: string) {
        await this.trackInteraction(lecture.id, userId, 'download');
        const fileUri = FileSystem.documentDirectory + lecture.file_name;
        const downloadResult = await FileSystem.downloadAsync(lecture.file_url, fileUri);

        if (downloadResult.status === 200) {
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadResult.uri);
            }
            return downloadResult.uri;
        }
        throw new Error('Download failed');
    }

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
            return Sharing.shareAsync(message);
        });
    }

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
}

export const lectureService = new LectureService();