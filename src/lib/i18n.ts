import { Language, TrackId } from '../types';

export const SURAH_TRANSLITERATIONS: Record<string, string> = {
  // Juz Amma
  'الناس': 'An-Nas',
  'الفلق': 'Al-Falaq',
  'الإخلاص': 'Al-Ikhlas',
  'المسد': 'Al-Masad',
  'النصر': 'An-Nasr',
  'الكافرون': 'Al-Kafirun',
  'الكوثر': 'Al-Kawthar',
  'الماعون': 'Al-Ma\'un',
  'قريش': 'Quraysh',
  'الفيل': 'Al-Fil',
  'الهمزة': 'Al-Humazah',
  'العصر': 'Al-Asr',
  'التكاثر': 'At-Takathur',
  'القارعة': 'Al-Qari\'ah',
  'العاديات': 'Al-Adiyat',
  'الزلزلة': 'Az-Zalzalah',
  'البينة': 'Al-Bayyinah',
  'القدر': 'Al-Qadr',
  'العلق': 'Al-Alaq',
  'التين': 'At-Tin',
  'الشرح': 'Ash-Sharh',
  'الضحى': 'Ad-Duha',
  'الليل': 'Al-Layl',
  'الشمس': 'Ash-Shams',
  'البلد': 'Al-Balad',
  'الفجر': 'Al-Fajr',
  'الغاشية': 'Al-Ghashiyah',
  'الأعلى': 'Al-A\'la',
  'الطارق': 'At-Tariq',
  'البروج': 'Al-Buruj',
  'الانشقاق': 'Al-Inshiqaq',
  'المطففين': 'Al-Mutaffifin',
  'الانفطار': 'Al-Infitar',
  'التكوير': 'At-Takwir',
  'عبس': 'Abasa',
  'النازعات': 'An-Nazi\'at',
  'النبأ': 'An-Naba',
  
  // Juz Tabarak
  'المرسلات': 'Al-Mursalat',
  'الإنسان': 'Al-Insan',
  'القيامة': 'Al-Qiyamah',
  'المدثر': 'Al-Muddathir',
  'المزمل': 'Al-Muzzammil',
  'الجن': 'Al-Jinn',
  'نوح': 'Nuh',
  'المعارج': 'Al-Ma\'arij',
  'الحاقة': 'Al-Haqqah',
  'القلم': 'Al-Qalam',
  'الملك': 'Al-Mulk',

  // Common
  'الفاتحة': 'Al-Fatihah',
  'البقرة': 'Al-Baqarah',
};

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  ar: {
    // App branding
    appName: 'نادي وِرد',
    appSubtitle: 'رحلة حفظ القرآن الكريم والارتقاء',
    welcomeBack: 'أهلاً بعودتك يا بطل القرآن',
    loginSubtitle: 'سجّل دخولك لمتابعة رحلة الحفظ ومواصلة وردك اليومي',

    // Navigation & Tabs
    nav_journey: 'الرحلة',
    nav_camp: 'مخيمي',
    nav_badges: 'الأوسمة',
    nav_profile: 'حسابي',
    nav_teacher: 'المعلم',
    nav_admin: 'الإدارة',
    nav_students: 'طلابي',
    nav_analytics: 'التحليلات',

    // Auth & Accounts
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب جديد',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    name: 'الاسم الكامل',
    gender: 'الجنس',
    male: 'ذكر (طالب)',
    female: 'أنثى (طالبة)',
    role: 'الصفة',
    role_student: 'طالب',
    role_teacher: 'معلم',
    role_admin: 'مدير',
    loggingIn: 'جاري تسجيل الدخول...',
    createAccountPrompt: 'ليس لديك حساب؟ أنشئ حساباً جديداً',
    alreadyHaveAccount: 'لديك حساب بالفعل؟ سجّل دخولك',
    forgotPassword: 'نسيت كلمة المرور؟',
    enterRegisteredEmail: 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً لإعادة التعيين.',
    sendResetLink: 'إرسال رابط الاستعادة',

    // Tracks
    track: 'المسار الدراسي',
    chooseTrackTitle: 'اختر مسارك الدراسي',
    chooseTrackSubtitle: 'حدد الخطة والمنهج الدراسي المناسب لك لبدء رحلة وِرد',
    track_juz_amma: 'جزء عم فقط (17 أسبوعاً)',
    track_juz_amma_desc: 'خطة متأنية ومتقنة لإتمام حفظ جزء عم المبارك (37 سورة) عبر 17 أسبوعاً دراسياً.',
    track_juz_amma_tabarak: 'جزء عم وجزء تبارك (16 أسبوعاً)',
    track_juz_amma_tabarak_desc: 'خطة متميزة ومكثفة تشمل حفظ جزأي عم وتبارك معاً (48 سورة) خلال 16 أسبوعاً دراسياً.',
    track_badge_amma: 'عم فقط',
    track_badge_amma_tabarak: 'عم وتبارك',
    confirmTrackBtn: 'تأكيد المسار وبدء الرحلة',
    changeTrackBtn: 'تغيير المسار الدراسي',
    changeTrackWarningTitle: 'تنبيه بشأن تغيير المسار',
    changeTrackWarning: 'تغيير مسارك الدراسي سيقوم بتحديث خطتك وسور الأسابيع وفق المنهج الجديد. هل أنت متأكد من المتابعة؟',
    currentTrack: 'مسارك الدراسي الحالي',

    // Language
    language: 'لغة التطبيق',
    lang_ar: 'العربية (Arabic)',
    lang_en: 'English (الإنجليزية)',

    // Quran Milestones & Nodes
    node_listen: 'استماع وترتيل',
    node_memorize: 'تكرار وحفظ',
    node_recite: 'تسميع واعتماد',
    node_review: 'مراجعة وتثبيت',
    node_gate: 'بوابة الأسبوع',
    week: 'الأسبوع',
    weekTitle: 'الأسبوع',
    milestones: 'محطات',
    milestone: 'محطة',
    completed: 'مكتمل',
    inProgress: 'قيد التقدم',
    locked: 'مغلق',
    streak: 'سلسلة الالتزام',
    days: 'أيام',
    xp: 'نقطة خبرة',
    audioRecitation: 'تسجيل التلاوة والتسميع',
    submitToTeacher: 'إرسال التسميع للمعلم',
    teacherNotes: 'ملاحظات المعلم',
    
    // Circles
    circle: 'الحلقة القرآنية',
    myCircle: 'حلقتي الحالية',
    joinCircle: 'الانضمام لحلقة',
    enterCircleCode: 'أدخل رمز الحلقة',
    joinCircleBtn: 'انضمام للحلقة',
    leaveCircle: 'مغادرة الحلقة',
    changeCircle: 'طلب تغيير الحلقة',

    // Actions & Common
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    save: 'حفظ التعديلات',
    saved: 'تم الحفظ بنجاح',
    close: 'إغلاق',
    refresh: 'تحديث',
    congratulations: 'مبارك!',
    excellent: 'ممتاز',
    notes: 'ملاحظات',
    stats: 'الإحصائيات',
    activeToday: 'النشطون اليوم',
    totalStudents: 'إجمالي الطلاب',
  },
  en: {
    // App branding
    appName: 'Ward Club',
    appSubtitle: 'Holy Quran Memorization & Mastery Journey',
    welcomeBack: 'Welcome back, Quran Champion',
    loginSubtitle: 'Sign in to continue your memorization journey and daily portion',

    // Navigation & Tabs
    nav_journey: 'Journey',
    nav_camp: 'My Camp',
    nav_badges: 'Badges',
    nav_profile: 'My Profile',
    nav_teacher: 'Teacher',
    nav_admin: 'Admin',
    nav_students: 'My Students',
    nav_analytics: 'Analytics',

    // Auth & Accounts
    login: 'Sign In',
    signup: 'Create Account',
    logout: 'Log Out',
    email: 'Email Address',
    password: 'Password',
    name: 'Full Name',
    gender: 'Gender',
    male: 'Male (Student)',
    female: 'Female (Student)',
    role: 'Role',
    role_student: 'Student',
    role_teacher: 'Teacher',
    role_admin: 'Admin',
    loggingIn: 'Signing in...',
    createAccountPrompt: "Don't have an account? Sign up",
    alreadyHaveAccount: 'Already have an account? Sign in',
    forgotPassword: 'Forgot password?',
    enterRegisteredEmail: 'Enter your registered email and we will send a password reset link.',
    sendResetLink: 'Send Reset Link',

    // Tracks
    track: 'Study Track',
    chooseTrackTitle: 'Choose Your Study Track',
    chooseTrackSubtitle: 'Select the study plan that fits your pace to start your journey with Ward Club',
    track_juz_amma: 'Juz Amma Only (17 Weeks)',
    track_juz_amma_desc: 'A steady and thorough plan to memorize Juz Amma (37 Surahs) across 17 structured weeks.',
    track_juz_amma_tabarak: 'Juz Amma & Tabarak (16 Weeks)',
    track_juz_amma_tabarak_desc: 'An intensive track covering both Juz Amma and Juz Tabarak (48 Surahs) over 16 structured weeks.',
    track_badge_amma: 'Amma Only',
    track_badge_amma_tabarak: 'Amma & Tabarak',
    confirmTrackBtn: 'Confirm Track & Begin Journey',
    changeTrackBtn: 'Change Study Track',
    changeTrackWarningTitle: 'Track Change Notice',
    changeTrackWarning: 'Changing your study track will update your curriculum and weekly surahs. Are you sure you want to proceed?',
    currentTrack: 'Current Study Track',

    // Language
    language: 'App Language',
    lang_ar: 'العربية (Arabic)',
    lang_en: 'English',

    // Quran Milestones & Nodes
    node_listen: 'Listening & Recitation',
    node_memorize: 'Repetition & Memorization',
    node_recite: 'Recitation & Approval',
    node_review: 'Revision & Mastery',
    node_gate: 'Weekly Gate',
    week: 'Week',
    weekTitle: 'Week',
    milestones: 'Milestones',
    milestone: 'Milestone',
    completed: 'Completed',
    inProgress: 'In Progress',
    locked: 'Locked',
    streak: 'Streak',
    days: 'days',
    xp: 'XP',
    audioRecitation: 'Audio Recitation Submission',
    submitToTeacher: 'Submit Recitation to Teacher',
    teacherNotes: 'Teacher Feedback',

    // Circles
    circle: 'Quran Circle',
    myCircle: 'My Current Circle',
    joinCircle: 'Join a Circle',
    enterCircleCode: 'Enter circle code',
    joinCircleBtn: 'Join Circle',
    leaveCircle: 'Leave Circle',
    changeCircle: 'Request Circle Change',

    // Actions & Common
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save Changes',
    saved: 'Saved successfully',
    close: 'Close',
    refresh: 'Refresh',
    congratulations: 'Congratulations!',
    excellent: 'Excellent',
    notes: 'Notes',
    stats: 'Statistics',
    activeToday: 'Active Today',
    totalStudents: 'Total Students',
  },
};

/**
 * Comprehensive Arabic to English dictionary covering all screens, buttons,
 * dialogs, alerts, table columns, tabs, and status messages.
 */
export const ARABIC_TO_ENGLISH: Record<string, string> = {
  // Navigation & Common
  'الرئيسية': 'Home',
  'الرحلة': 'Journey',
  'المخيم': 'My Camp',
  'مخيمي': 'My Camp',
  'الإنجازات': 'Achievements',
  'الأوسمة': 'Badges',
  'حسابي': 'Profile',
  'الملف الشخصي': 'Profile',
  'لوحة المعلم': 'Teacher Dashboard',
  'بوابة المعلم': 'Teacher Portal',
  'لوحة الإدارة': 'Admin Dashboard',
  'بوابة الإدارة': 'Admin Portal',
  'طلابي': 'My Students',
  'الحلقة': 'Circle',
  'حلقاتي': 'My Circles',
  'الحلقات القرآنية': 'Quran Circles',
  'المعلم': 'Teacher',
  'الطالب': 'Student',
  'المدير': 'Admin',
  'تسجيل الخروج': 'Log Out',
  'تسجيل الدخول': 'Sign In',
  'إنشاء حساب جديد': 'Create Account',
  'حفظ التعديلات': 'Save Changes',
  'حفظ': 'Save',
  'تم الحفظ بنجاح': 'Saved successfully',
  'تأكيد': 'Confirm',
  'إلغاء': 'Cancel',
  'إغلاق': 'Close',
  'تحديث': 'Refresh',
  'رجوع': 'Back',
  'التالي': 'Next',
  'السابق': 'Previous',
  'متابعة': 'Continue',
  'بدء': 'Start',
  'ابدأ': 'Start',
  'تم': 'Done',
  'مكتمل': 'Completed',
  'قيد التقدم': 'In Progress',
  'مغلق': 'Locked',
  'متاح': 'Available',
  'معتمد': 'Approved',
  'بانتظار المراجعة': 'Pending Review',
  'بانتظار الاعتماد': 'Pending Approval',
  'يحتاج إعادة': 'Needs Practice',
  'غائب': 'Absent',
  'حاضر': 'Present',
  'مبارك!': 'Congratulations!',
  'أحسنت!': 'Well Done!',
  'ممتاز': 'Excellent',
  'جيد جداً': 'Very Good',
  'جيد': 'Good',
  'ملاحظات': 'Notes',
  'الإحصائيات': 'Statistics',
  'بحث': 'Search',
  'تصفية': 'Filter',
  'الكل': 'All',
  'حذف': 'Delete',
  'تعديل': 'Edit',
  'إضافة': 'Add',
  'نسخ': 'Copy',
  'تم النسخ': 'Copied',
  'رمز الانضمام': 'Join Code',
  'نسخ الرمز': 'Copy Code',
  'تم نسخ الرمز!': 'Code Copied!',

  // Student Journey & Milestones
  'رحلة وِرد': 'Ward Journey',
  'نادي وِرد': 'Ward Club',
  'استماع وترتيل': 'Listening & Recitation',
  'تكرار وحفظ': 'Repetition & Memorization',
  'تسميع واعتماد': 'Recitation & Approval',
  'مراجعة وتثبيت': 'Revision & Mastery',
  'بوابة الأسبوع': 'Weekly Gate',
  'اختبار بوابة الأسبوع': 'Weekly Gate Test',
  'سلسلة الالتزام': 'Commitment Streak',
  'نقاط الخبرة': 'Experience Points (XP)',
  'نقطة خبرة': 'XP',
  'محطة': 'Milestone',
  'محطات': 'Milestones',
  'الأسبوع': 'Week',
  'أسبوع': 'Week',
  'خريطة الرحلة': 'Journey Map',
  'المستوى الحالي': 'Current Level',
  'السور المقررة': 'Assigned Surahs',
  'سورة': 'Surah',
  'السورة': 'Surah',
  'تسميع السور المقررة': 'Recite Assigned Surahs',
  'تسجيل صوتي': 'Audio Recording',
  'تسجيل التلاوة والتسميع': 'Record Recitation',
  'إرسال التسميع للمعلم': 'Submit to Teacher',
  'تسميع في الحلقة': 'Recite in Circle',
  'طلب التسميع في الحلقة': 'Request Recitation in Circle',
  'تسجيل صوتي للمعلم': 'Audio Recording for Teacher',
  'ملاحظات المعلم': 'Teacher Feedback',
  'توجيهات المعلم': 'Teacher Instructions',
  'تقييم المعلم': 'Teacher Evaluation',
  'ابدأ المحطة': 'Start Milestone',
  'إعادة المحطة': 'Retake Milestone',
  'إكمال المهمة': 'Complete Task',
  'استمع إلى الآيات الكريمة بترتيل متقن': 'Listen to the verses with precise recitation',
  'كرر الآيات وأتقن حفظها': 'Repeat the verses and master memorization',
  'سجل تلاوتك بصوتك أو اطلب التسميع المباشر في الحلقة': 'Record your voice or request live circle recitation',
  'راجع ما حفظته وثبته جيداً': 'Review and solidify what you have memorized',
  'اجتز اختبار البوابة للانتقال إلى الأسبوع التالي': 'Pass the gate test to unlock the next week',

  // Gate Exam & Quiz Engine
  'اختبار الإتقان والتثبيت': 'Mastery & Retention Exam',
  'أجب عن الأسئلة التالية بدقة لإثبات إتقانك لسور الأسبوع': 'Answer the following questions accurately to prove your mastery',
  'السؤال': 'Question',
  'من': 'of',
  'السؤال التالي': 'Next Question',
  'إنهاء الاختبار': 'Finish Exam',
  'إجابة صحيحة!': 'Correct Answer!',
  'إجابة خاطئة': 'Incorrect Answer',
  'النتيجة النهائية': 'Final Result',
  'تهانينا! لقد اجتزت اختبار الأسبوع بنجاح': 'Congratulations! You passed the weekly test',
  'تحتاج إلى مراجعة إضافية قبل اجتياز البوابة': 'You need additional review before passing the gate',
  'حاول مجدداً': 'Try Again',
  'فتح الأسبوع التالي': 'Unlock Next Week',
  'استلام المكافأة': 'Claim Reward',
  'مكافأة الأسبوع': 'Weekly Reward',
  'وسام جديد': 'New Badge',
  'أكمل الآية التالية:': 'Complete the following verse:',
  'ما هي السورة التي تحتوي على هذه الآية؟': 'Which Surah contains this verse?',
  'اختر الترتيب الصحيح للآيات:': 'Choose the correct order of the verses:',

  // Teacher Dashboard & Reviews
  'لوحة متابعة المعلم': 'Teacher Supervision Dashboard',
  'إدارة الحلقات والطلاب': 'Manage Circles & Students',
  'إنشاء حلقة جديدة': 'Create New Circle',
  'اسم الحلقة': 'Circle Name',
  'نوع الحلقة': 'Circle Type',
  'بنين': 'Boys',
  'بنات': 'Girls',
  'حلقة بنين': 'Boys Circle',
  'حلقة بنات': 'Girls Circle',
  'طلاب الحلقة': 'Circle Students',
  'إجمالي الطلاب': 'Total Students',
  'الطلاب النشطون': 'Active Students',
  'قائمة الانتظار': 'Review Queue',
  'تسجيلات بانتظار الاعتماد': 'Recordings Pending Review',
  'تسميعات الحلقة': 'Circle Recitations',
  'لا توجد تسجيلات بانتظار الاعتماد': 'No recordings awaiting review',
  'جميع المهام والتسميعات تم تقييمها بنجاح.': 'All tasks and recitations have been reviewed.',
  'تقييم التسميع': 'Evaluate Recitation',
  'اعتماد التسميع': 'Approve Recitation',
  'طلب إعادة التدريب': 'Request Practice',
  'تسجيل غياب': 'Mark Absent',
  'أدخل ملاحظاتك وتوجيهاتك للطالب...': 'Enter notes and guidance for student...',
  'التقييم': 'Rating',
  'إرسال التقييم': 'Submit Evaluation',
  'جاري الحفظ...': 'Saving...',
  'استمع إلى التسجيل': 'Listen to Recording',
  'تشغيل': 'Play',
  'إيقاف': 'Pause',
  'المدة': 'Duration',
  'تفاصيل إنجاز الطالب': 'Student Achievement Details',
  'التقدم الدراسي': 'Academic Progress',
  'المحطات المكتملة': 'Completed Milestones',
  'تاريخ التسليم': 'Submission Date',
  'حالة الطالب': 'Student Status',
  'نشط': 'Active',
  'متأخر': 'Late',
  'منقطع': 'Inactive',
  'أسئلة مقترحة للاختبار الشفهي:': 'Suggested oral exam questions:',

  // Camp & Audio Player
  'مخيم وِرد': 'Ward Camp',
  'متجر المخيم': 'Camp Store',
  'المقتنيات': 'Inventory',
  'تخصيص المخيم': 'Customize Camp',
  'المرافق': 'Camp Facilities',
  'الرفيق القرآني': 'Quran Companion',
  'شراء': 'Purchase',
  'مملوك': 'Owned',
  'موضوع في المخيم': 'Placed in Camp',
  'وضع في المخيم': 'Place in Camp',
  'إزالة من المخيم': 'Remove from Camp',
  'المصحف المرتل': 'Quran Audio Player',
  'اختر القارئ': 'Select Reciter',
  'القارئ': 'Reciter',
  'جزء عم': 'Juz Amma',
  'جزء تبارك': 'Juz Tabarak',
  'جزء قد سمع': 'Juz Qad Samia',
  'القرآن الكريم': 'The Holy Quran',
  'الاستماع للتلاوة': 'Listen to Recitation',

  // Profile & Settings
  'إعدادات الحساب': 'Account Settings',
  'البيانات الشخصية': 'Personal Information',
  'الاسم الكامل': 'Full Name',
  'الصفة': 'Role',
  'الجنس': 'Gender',
  'ذكر (طالب)': 'Male (Student)',
  'أنثى (طالبة)': 'Female (Student)',
  'تعديل المظهر والشخصية': 'Customize Avatar',
  'نمط الشخصية': 'Avatar Style',
  'لون الرداء': 'Outfit Color',
  'الحقيبة': 'Satchel',
  'الملحق': 'Accessory',
  'الحلقة القرآنية': 'Quran Circle',
  'حلقتي الحالية': 'My Current Circle',
  'الانضمام لحلقة': 'Join a Circle',
  'طلب تغيير الحلقة': 'Request Circle Change',
  'مغادرة الحلقة': 'Leave Circle',
  'تغيير المسار الدراسي': 'Change Study Track',
  'مسارك الدراسي الحالي': 'Current Study Track',
  'لغة التطبيق': 'App Language',
  'تغيير كلمة المرور': 'Change Password',
  'كلمة المرور الحالية': 'Current Password',
  'كلمة المرور الجديدة': 'New Password',
  'تأكيد كلمة المرور': 'Confirm Password',
  'إعادة تعيين التقدم': 'Reset Progress',
  'حفظ التغييرات': 'Save Changes',
  'تم حفظ التعديلات بنجاح': 'Profile updated successfully',

  // Track Names
  'جزء عم فقط (17 أسبوعاً)': 'Juz Amma Only (17 Weeks)',
  'جزء عم وجزء تبارك (16 أسبوعاً)': 'Juz Amma & Tabarak (16 Weeks)',
  'عم فقط': 'Amma Only',
  'عم وتبارك': 'Amma & Tabarak',
  'قد سمع': 'Qad Samia',
  'المسارات القادمة': 'Upcoming Tracks',

  // Biome Zones & Journey Landmarks
  'واحة البداية': 'Oasis of Beginnings',
  'مدخل جزء عم والقصار المكية': 'Gateway to Juz Amma & Short Meccan Surahs',
  'غابة التلاوة': 'Forest of Recitation',
  'ترتيل وإتقان المنهج المكثف': 'Intensive Recitation & Mastery',
  'مرتفعات التثبيت': 'Heights of Consolidation',
  'صعود السور المتوسطة وتثبيت الحفظ': 'Medium Surahs & Memorization Consolidation',
  'وادي الفرقان': 'Valley of Al-Furqan',
  'جسور المراجعة والتأمل في المعاني': 'Bridges of Review & Contemplation',
  'حصن المعرفة': 'Fortress of Knowledge',
  'الاقتراب من طوال جزء عم المبارك': 'Approaching the Longer Surahs of Juz Amma',
  'قلعة الإتقان الختامية': 'Grand Citadel of Mastery',
  'الختام الميمون وتتويج حافظ جزء عم': 'Blessed Conclusion & Coronation of the Hafiz',
  'معلم منتصف المنطقة • استراحة السكينة والتدبر': 'Midpoint Landmark • Reflection Rest',
  'منطقة البداية': 'Starting Zone',
  'اختبار إتقان الأسبوع': 'Weekly Mastery Test',
  'اختبار عبور': 'Gate Exam',
  'بانتظار اعتماد المعلم': 'Pending Teacher Review',
  'قلعة إتقان جزء عم': 'Juz Amma Mastery Citadel',
  'قلعة إتقان عم وتبارك': 'Amma & Tabarak Mastery Citadel',
  'قلعة إتقان جزء قد سمع': 'Juz Qad Samia Mastery Citadel',
  'The grand coronation and noble badge for completing blessed Juz Amma': 'The grand coronation and noble badge for completing blessed Juz Amma',
  'التتويج الأكبر والحصول على الوسام الشريف لختم جزء عم المبارك': 'The grand coronation and noble badge for completing blessed Juz Amma',
  'التتويج الأكبر والحصول على الوسام الشريف لختم جزأي عم وتبارك': 'The grand coronation and noble badge for completing both Juz Amma & Tabarak',
  'التتويج الأكبر والحصول على الوسام الشريف لختم جزء قد سمع المبارك': 'The grand coronation and noble badge for completing blessed Juz Qad Samia',

  // Admin Dashboard
  'إدارة النظام': 'System Administration',
  'المعلمين والحلقات': 'Teachers & Circles',
  'ترقية مدير جديد': 'Promote New Admin',
  'إضافة معلم': 'Add Teacher',
  'إحصائيات المنصة': 'Platform Statistics',
  'إجمالي المعلمين': 'Total Teachers',
  'إجمالي الحلقات': 'Total Circles',
  'إجمالي التسميعات': 'Total Recitations',
  'البريد الإلكتروني للمعلم': 'Teacher Email',
  'اسم المعلم': 'Teacher Name',
  'إنشاء حساب المعلم': 'Create Teacher Account',
};

/**
 * Normalizes text to assist in flexible dictionary matching
 */
function normalizeArabicText(str: string): string {
  return str
    .trim()
    .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي');
}

/**
 * Get translated text for key or fallback, with fallback to phrase dictionary
 */
export function t(key: string, lang: Language = 'ar', fallback?: string): string {
  if (!key) return '';
  const trimmed = key.trim();

  // If the key is specifically requesting a language name display
  if (trimmed === 'lang_ar') return lang === 'en' ? 'Arabic' : 'العربية';
  if (trimmed === 'lang_en') return lang === 'en' ? 'English' : 'الإنجليزية';

  // Protect against accidental language code passed as fallback ('ar' or 'en')
  const cleanFallback = (fallback === 'ar' || fallback === 'en') ? undefined : fallback;

  // Arabic output requested
  if (lang === 'ar') {
    if (TRANSLATIONS.ar[trimmed]) {
      const val = TRANSLATIONS.ar[trimmed];
      if (val !== 'ar' && val !== 'en') return val;
    }
    // Return clean fallback if available, else original Arabic text
    return cleanFallback || trimmed;
  }

  // English output requested
  // 1. Direct translation key match in en translations
  if (TRANSLATIONS.en[trimmed]) {
    const val = TRANSLATIONS.en[trimmed];
    if (val !== 'ar' && val !== 'en') return val;
  }

  // 2. Direct match in Arabic to English dictionary
  if (ARABIC_TO_ENGLISH[trimmed]) {
    const val = ARABIC_TO_ENGLISH[trimmed];
    if (val !== 'ar' && val !== 'en') return val;
  }

  // 3. Normalized dictionary check
  const normInput = normalizeArabicText(trimmed);
  for (const [arKey, enVal] of Object.entries(ARABIC_TO_ENGLISH)) {
    if (normalizeArabicText(arKey) === normInput) {
      if (enVal !== 'ar' && enVal !== 'en') return enVal;
    }
  }

  // 4. Dynamic Regex patterns for parameterized texts
  // Gate tests: "🏆 بوابة الأسبوع 5" -> "🏆 Week 5 Gate", "بوابة الأسبوع 3" -> "Week 3 Gate"
  const gateMatch = trimmed.match(/^(?:🏆\s*)?(?:بوابة\s+(?:الأسبوع\s+)?|اختبار\s+(?:إتقان\s+)?الأسبوع\s*)(\d+)$/);
  if (gateMatch) {
    return `🏆 Week ${gateMatch[1]} Gate`;
  }

  // Final Citadels
  if (trimmed.includes('قلعة الاختبار النهائي لجزء عم وجزء تبارك') || trimmed.includes('قلعة إتقان عم وتبارك')) {
    return '🏆 Grand Finale Citadel for Amma & Tabarak';
  }
  if (trimmed.includes('قلعة الاختبار النهائي لجزء قد سمع') || trimmed.includes('قلعة إتقان جزء قد سمع')) {
    return '🏆 Grand Finale Citadel for Juz Qad Samia';
  }
  if (trimmed.includes('قلعة الاختبار النهائي لجزء عم') || trimmed.includes('قلعة إتقان جزء عم') || trimmed.includes('قلعة الإتقان الختامية')) {
    return '🏆 Grand Finale Citadel for Juz Amma';
  }

  // Ordinal weeks in Arabic: "الأسبوع الأول" -> "Week 1", etc.
  const ordinalWeeks: Record<string, string> = {
    'الأسبوع الأول': 'Week 1',
    'الأسبوع الثاني': 'Week 2',
    'الأسبوع الثالث': 'Week 3',
    'الأسبوع الرابع': 'Week 4',
    'الأسبوع الخامس': 'Week 5',
    'الأسبوع السادس': 'Week 6',
    'الأسبوع السابع': 'Week 7',
    'الأسبوع الثامن': 'Week 8',
    'الأسبوع التاسع': 'Week 9',
    'الأسبوع العاشر': 'Week 10',
    'الأسبوع الحادي عشر': 'Week 11',
    'الأسبوع الثاني عشر': 'Week 12',
    'الأسبوع الثالث عشر': 'Week 13',
    'الأسبوع الرابع عشر': 'Week 14',
    'الأسبوع الخامس عشر': 'Week 15',
    'الأسبوع السادس عشر': 'Week 16',
    'الأسبوع السابع عشر': 'Week 17',
    'الأسبوع الثامن عشر': 'Week 18',
  };
  if (ordinalWeeks[trimmed]) {
    return ordinalWeeks[trimmed];
  }

  // Week numbers: "الأسبوع 3" -> "Week 3", "أسبوع 5" -> "Week 5"
  const weekMatch = trimmed.match(/^(?:الأسبوع|أسبوع)\s*(\d+)$/);
  if (weekMatch) {
    return `Week ${weekMatch[1]}`;
  }

  // Milestone numbers: "محطة 2" -> "Milestone 2"
  const milestoneMatch = trimmed.match(/^(?:محطة|المحطة)\s*(\d+)$/);
  if (milestoneMatch) {
    return `Milestone ${milestoneMatch[1]}`;
  }

  // Completed milestones: "4 محطة مكتملة" -> "4 milestones completed"
  const compMilestonesMatch = trimmed.match(/^(\d+)\s*(?:محطة مكتملة|محطات مكتملة)$/);
  if (compMilestonesMatch) {
    return `${compMilestonesMatch[1]} milestones completed`;
  }

  // Surah references: "سورة الفاتحة" -> "Surah Al-Fatihah"
  const surahMatch = trimmed.match(/^(?:سورة|السورة)\s+(.+)$/);
  if (surahMatch) {
    const surahName = getSurahName(surahMatch[1], 'en');
    return `Surah ${surahName}`;
  }

  // Streak days: "5 يوماً" or "5 أيام" or "5 د" -> "5 days" or "5 d"
  const dayMatch = trimmed.match(/^(\d+)\s*(?:يوماً|أيام|يوم)$/);
  if (dayMatch) {
    return `${dayMatch[1]} ${parseInt(dayMatch[1], 10) === 1 ? 'day' : 'days'}`;
  }
  const dayShortMatch = trimmed.match(/^(\d+)\s*د$/);
  if (dayShortMatch) {
    return `${dayShortMatch[1]} d`;
  }

  // XP: "50 نقطة" -> "50 XP"
  const xpMatch = trimmed.match(/^(\d+)\s*(?:نقطة|نقاط)(?:\s*خبرة)?$/);
  if (xpMatch) {
    return `${xpMatch[1]} XP`;
  }

  // Fallback: never return literal 'ar' or 'en'
  const finalVal = cleanFallback || trimmed;
  if (finalVal === 'ar' || finalVal === 'en') {
    return trimmed;
  }
  return finalVal;
}

/**
 * Translates an Arabic Surah name phonetically into English
 */
export function getSurahName(arabicName: string, lang: Language = 'ar'): string {
  if (lang === 'ar') return arabicName;
  const clean = arabicName.trim().replace(/^سورة\s+/, '');
  return SURAH_TRANSLITERATIONS[clean] || clean;
}

/**
 * Translates a comma-separated or text containing surah names
 */
export function translateSurahList(surahs: string[] | string, lang: Language = 'ar'): string {
  if (lang === 'ar') {
    return Array.isArray(surahs) ? surahs.join('، ') : surahs;
  }
  const list = Array.isArray(surahs) ? surahs : surahs.split(/[\s،,]+/);
  return list
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => getSurahName(s, 'en'))
    .join(', ');
}

/**
 * Translates track ID to human label
 */
export function getTrackTitle(trackId?: TrackId | string | null, lang: Language = 'ar'): string {
  if (trackId === 'juz_amma_tabarak') {
    return t('track_juz_amma_tabarak', lang);
  }
  return t('track_juz_amma', lang);
}

/**
 * Translates track ID to compact badge label
 */
export function getTrackBadge(trackId?: TrackId | string | null, lang: Language = 'ar'): string {
  if (trackId === 'juz_amma_tabarak') {
    return t('track_badge_amma_tabarak', lang);
  }
  return t('track_badge_amma', lang);
}
