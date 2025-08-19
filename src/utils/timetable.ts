// utils/timetable.ts

import {
    TimetableEntryWithDetails,
    DayOfWeek,
    DAYS_ORDER,
    TimeSlot,
    DaySchedule,
    WeekSchedule
} from '@/src/types/timetable';

/**
 * Convert time string to minutes since midnight
 */
export const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Convert minutes since midnight to time string
 */
export const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Calculate duration between two times in minutes
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
    return timeToMinutes(endTime) - timeToMinutes(startTime);
};

/**
 * Check if two time ranges overlap
 */
export const timesOverlap = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
): boolean => {
    const start1Minutes = timeToMinutes(start1);
    const end1Minutes = timeToMinutes(end1);
    const start2Minutes = timeToMinutes(start2);
    const end2Minutes = timeToMinutes(end2);

    return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
};

/**
 * Find free time slots in a day
 */
export const findFreeSlots = (
    entries: TimetableEntryWithDetails[],
    dayStart: string = '08:00',
    dayEnd: string = '18:00',
    minDuration: number = 60 // minutes
): TimeSlot[] => {
    const freeSlots: TimeSlot[] = [];
    const sortedEntries = entries.sort((a, b) => a.start_time.localeCompare(b.start_time));

    let currentTime = timeToMinutes(dayStart);
    const endTime = timeToMinutes(dayEnd);

    for (const entry of sortedEntries) {
        const entryStart = timeToMinutes(entry.start_time);
        const entryEnd = timeToMinutes(entry.end_time);

        // Check if there's a gap before this entry
        if (entryStart > currentTime) {
            const slotDuration = entryStart - currentTime;
            if (slotDuration >= minDuration) {
                freeSlots.push({
                    start: minutesToTime(currentTime),
                    end: minutesToTime(entryStart),
                    duration: slotDuration
                });
            }
        }

        currentTime = Math.max(currentTime, entryEnd);
    }

    // Check if there's time after the last entry
    if (currentTime < endTime) {
        const slotDuration = endTime - currentTime;
        if (slotDuration >= minDuration) {
            freeSlots.push({
                start: minutesToTime(currentTime),
                end: minutesToTime(endTime),
                duration: slotDuration
            });
        }
    }

    return freeSlots;
};

/**
 * Generate day schedule with statistics
 */
export const generateDaySchedule = (
    day: DayOfWeek,
    entries: TimetableEntryWithDetails[]
): DaySchedule => {
    const dayEntries = entries.filter(entry => entry.day === day);
    const totalHours = dayEntries.reduce((total, entry) => {
        return total + (calculateDuration(entry.start_time, entry.end_time) / 60);
    }, 0);

    const freeSlots = findFreeSlots(dayEntries);

    return {
        day,
        entries: dayEntries,
        total_hours: Math.round(totalHours * 100) / 100,
        free_slots: freeSlots
    };
};

/**
 * Generate week schedule with statistics
 */
export const generateWeekSchedule = (
    entries: TimetableEntryWithDetails[],
    weekStart: Date
): WeekSchedule => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const days = DAYS_ORDER.map(day => generateDaySchedule(day, entries));
    const totalClasses = entries.length;
    const totalHours = days.reduce((total, day) => total + day.total_hours, 0);

    return {
        week_start: weekStart,
        week_end: weekEnd,
        days,
        total_classes: totalClasses,
        total_hours: Math.round(totalHours * 100) / 100
    };
};

/**
 * Check for scheduling conflicts
 */
export const findConflicts = (
    newEntry: { day: DayOfWeek; start_time: string; end_time: string; class_id: string },
    existingEntries: TimetableEntryWithDetails[],
    excludeId?: string
): TimetableEntryWithDetails[] => {
    return existingEntries.filter(entry => {
        if (excludeId && entry.id === excludeId) return false;
        if (entry.day !== newEntry.day) return false;
        if (entry.class_id !== newEntry.class_id) return false;

        return timesOverlap(
            newEntry.start_time,
            newEntry.end_time,
            entry.start_time,
            entry.end_time
        );
    });
};

/**
 * Sort entries by day and time
 */
export const sortTimetableEntries = (entries: TimetableEntryWithDetails[]): TimetableEntryWithDetails[] => {
    return entries.sort((a, b) => {
        const dayDiff = DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return a.start_time.localeCompare(b.start_time);
    });
};

/**
 * Group entries by class
 */
export const groupByClass = (entries: TimetableEntryWithDetails[]): Record<string, TimetableEntryWithDetails[]> => {
    return entries.reduce((groups, entry) => {
        const key = entry.class_id;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(entry);
        return groups;
    }, {} as Record<string, TimetableEntryWithDetails[]>);
};

/**
 * Group entries by teacher
 */
export const groupByTeacher = (entries: TimetableEntryWithDetails[]): Record<string, TimetableEntryWithDetails[]> => {
    return entries.reduce((groups, entry) => {
        const key = entry.teacher_id;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(entry);
        return groups;
    }, {} as Record<string, TimetableEntryWithDetails[]>);
};

/**
 * Group entries by day
 */
export const groupByDay = (entries: TimetableEntryWithDetails[]): Record<DayOfWeek, TimetableEntryWithDetails[]> => {
    const groups: Record<DayOfWeek, TimetableEntryWithDetails[]> = {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: []
    };

    entries.forEach(entry => {
        groups[entry.day].push(entry);
    });

    // Sort entries within each day
    Object.keys(groups).forEach(day => {
        groups[day as DayOfWeek].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return groups;
};

/**
 * Find next upcoming class
 */
export const findNextClass = (entries: TimetableEntryWithDetails[]): TimetableEntryWithDetails | null => {
    const now = new Date();
    const currentDay = DAYS_ORDER[now.getDay() - 1]; // getDay() returns 0-6, we need 1-6 for Mon-Sat
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (!currentDay) return null; // Sunday

    // First, look for classes today that haven't started yet
    const todayEntries = entries
        .filter(entry => entry.day === currentDay && entry.start_time > currentTime)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

    if (todayEntries.length > 0) {
        return todayEntries[0];
    }

    // If no classes today, look for the next day with classes
    const currentDayIndex = DAYS_ORDER.indexOf(currentDay);
    for (let i = 1; i < DAYS_ORDER.length; i++) {
        const nextDayIndex = (currentDayIndex + i) % DAYS_ORDER.length;
        const nextDay = DAYS_ORDER[nextDayIndex];

        const nextDayEntries = entries
            .filter(entry => entry.day === nextDay)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));

        if (nextDayEntries.length > 0) {
            return nextDayEntries[0];
        }
    }

    return null;
};

/**
 * Calculate workload statistics for a teacher
 */
export const calculateTeacherWorkload = (
    teacherId: string,
    entries: TimetableEntryWithDetails[]
): {
    totalClasses: number;
    totalHours: number;
    averageHoursPerDay: number;
    classesByDay: Record<DayOfWeek, number>;
    subjects: string[];
} => {
    const teacherEntries = entries.filter(entry => entry.teacher_id === teacherId);
    const totalClasses = teacherEntries.length;
    const totalHours = teacherEntries.reduce((total, entry) => {
        return total + (calculateDuration(entry.start_time, entry.end_time) / 60);
    }, 0);

    const classesByDay = groupByDay(teacherEntries);
    const classesByDayCount: Record<DayOfWeek, number> = {
        Monday: classesByDay.Monday.length,
        Tuesday: classesByDay.Tuesday.length,
        Wednesday: classesByDay.Wednesday.length,
        Thursday: classesByDay.Thursday.length,
        Friday: classesByDay.Friday.length,
        Saturday: classesByDay.Saturday.length,
    };

    const workingDays = Object.values(classesByDayCount).filter(count => count > 0).length;
    const averageHoursPerDay = workingDays > 0 ? totalHours / workingDays : 0;

    const subjects = [...new Set(teacherEntries.map(entry => entry.subject))];

    return {
        totalClasses,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
        classesByDay: classesByDayCount,
        subjects
    };
};

/**
 * Validate time format (HH:MM)
 */
export const isValidTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

/**
 * Format time for display (convert 24h to 12h format)
 */
export const formatTimeForDisplay = (time: string, use12Hour: boolean = false): string => {
    if (!use12Hour) return time;

    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Generate time slots for a day (useful for dropdowns)
 */
export const generateTimeSlots = (
    startTime: string = '08:00',
    endTime: string = '18:00',
    interval: number = 30 // minutes
): string[] => {
    const slots: string[] = [];
    let current = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    while (current <= end) {
        slots.push(minutesToTime(current));
        current += interval;
    }

    return slots;
};