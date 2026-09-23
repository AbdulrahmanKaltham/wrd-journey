import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  ArrowRightLeft,
  Award,
  RotateCcw,
  UserX,
  Sparkles,
  Info,
  Calendar,
  UserCheck,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useSupabase } from '../../context/SupabaseContext';
import { AppNotification } from '../../types';

export const NotificationModal: React.FC = () => {
  const {
    notifications,
    unreadNotificationsCount,
    isNotificationsModalOpen,
    setIsNotificationsModalOpen,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    respondToCircleTransfer,
    user,
  } = useSupabase();

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isNotificationsModalOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const handleRespondTransfer = async (
    notificationId: string,
    action: 'accept' | 'reject'
  ) => {
    setProcessingId(notificationId);
    try {
      await respondToCircleTransfer(notificationId, action);
    } finally {
      setProcessingId(null);
    }
  };

  const formatRelativeTime = (isoDate: string): string => {
    try {
      const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
      if (diff < 60) return 'الآن';
      if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        return `منذ ${mins} ${mins === 1 ? 'دقيقة' : mins === 2 ? 'دقيقتين' : mins <= 10 ? 'دقائق' : 'دقيقة'}`;
      }
      if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `منذ ${hours} ${hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتين' : hours <= 10 ? 'ساعات' : 'ساعة'}`;
      }
      const days = Math.floor(diff / 86400);
      if (days === 1) return 'أمس';
      if (days === 2) return 'منذ يومين';
      return `منذ ${days} أيام`;
    } catch {
      return '';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'circle_transfer_request':
        return <ArrowRightLeft className="w-5 h-5 text-amber-600" />;
      case 'circle_transfer_accepted':
        return <UserCheck className="w-5 h-5 text-emerald-600" />;
      case 'circle_transfer_rejected':
        return <UserX className="w-5 h-5 text-rose-500" />;
      case 'recitation_approved':
        return <Award className="w-5 h-5 text-emerald-600" />;
      case 'recitation_practice':
        return <RotateCcw className="w-5 h-5 text-blue-600" />;
      case 'recitation_absent':
        return <Calendar className="w-5 h-5 text-rose-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const getNotificationBg = (type: string, isRead: boolean) => {
    if (!isRead) {
      switch (type) {
        case 'circle_transfer_request':
          return 'bg-amber-50/80 border-amber-200';
        case 'circle_transfer_accepted':
        case 'recitation_approved':
          return 'bg-emerald-50/80 border-emerald-200';
        case 'recitation_practice':
          return 'bg-blue-50/80 border-blue-200';
        case 'circle_transfer_rejected':
        case 'recitation_absent':
          return 'bg-rose-50/80 border-rose-200';
        default:
          return 'bg-slate-50 border-slate-200';
      }
    }
    return 'bg-white border-slate-100 hover:bg-slate-50/60';
  };

  return (
    <div
      id="notification-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs font-arabic"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsNotificationsModalOpen(false);
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[88vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#006304] flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-base text-slate-800">
                  الإشعارات
                </h3>
                {unreadNotificationsCount > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full font-num">
                    {unreadNotificationsCount} جديدة
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                تنبيهات الحلقات، التسميع، والتحديثات المباشرة
              </p>
            </div>
          </div>

          <button
            id="close-notifications-btn"
            onClick={() => setIsNotificationsModalOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-slate-200/60 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Filters Bar */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs gap-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              الكل ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              غير المقروءة ({unreadNotificationsCount})
            </button>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-1.5">
            {unreadNotificationsCount > 0 && (
              <button
                id="mark-all-read-btn"
                onClick={() => markAllNotificationsAsRead()}
                className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2 py-1 rounded-md font-bold transition-colors cursor-pointer"
                title="تحديد الكل كمقروء"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>تحديد الكل كمقروء</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                id="clear-all-notifications-btn"
                onClick={() => {
                  if (window.confirm('هل تريد مسح جميع الإشعارات؟')) {
                    clearAllNotifications();
                  }
                }}
                className="text-[11px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition-colors cursor-pointer"
                title="مسح الكل"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Bell className="w-7 h-7" />
              </div>
              <h4 className="font-heading font-black text-sm text-slate-700">
                {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات حالياً'}
              </h4>
              {user.role !== 'teacher' && (
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  ستصلك التنبيهات هنا فور مراجعة التسميع أو طلبات الحلقات.
                </p>
              )}
            </div>
          ) : (
            filteredNotifications.map((notif: AppNotification) => {
              const isTransferRequest = notif.type === 'circle_transfer_request';
              const isTransferAccepted = notif.type === 'circle_transfer_accepted';
              const isTransferRejected = notif.type === 'circle_transfer_rejected';
              const isTransferRelated = isTransferRequest || isTransferAccepted || isTransferRejected;
              const transferStatus = notif.data?.status || 'pending';
              const isTeacher = user.role === 'teacher';

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.isRead) markNotificationAsRead(notif.id);
                  }}
                  className={`p-3.5 rounded-xl border transition-all relative ${getNotificationBg(
                    notif.type,
                    notif.isRead
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-0.5 p-2 rounded-lg bg-white shadow-2xs shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <h4
                            className={`text-xs ${
                              notif.isRead ? 'font-bold text-slate-700' : 'font-black text-slate-900'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-num shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Circle Transfer Detail Card (Request, Accepted, Rejected) */}
                      {isTransferRelated && notif.data && (notif.data.targetCircleName || notif.data.currentCircleName) && (
                        <div className={`mt-2.5 p-2.5 rounded-lg border text-xs space-y-2 ${
                          isTransferAccepted
                            ? 'bg-emerald-50/90 border-emerald-200'
                            : isTransferRejected
                            ? 'bg-rose-50/90 border-rose-200'
                            : 'bg-amber-50/90 border-amber-200'
                        }`}>
                          {/* اسم الطالب للمعلم أو اسم المعلم للطالب */}
                          {isTransferRequest ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-amber-800 shrink-0">الطالب:</span>
                              <span className="font-bold text-slate-900 truncate">{notif.data.studentName || 'طالب قرآن'}</span>
                            </div>
                          ) : notif.data.teacherName ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[11px] font-medium shrink-0 ${
                                isTransferAccepted ? 'text-emerald-800' : 'text-rose-800'
                              }`}>المعلم:</span>
                              <span className="font-bold text-slate-900 truncate">{notif.data.teacherName}</span>
                            </div>
                          ) : null}

                          {/* مسار النقل الموحد: من الحلقة الحالية ← إلى الحلقة الجديدة */}
                          <div className={`flex items-center justify-between gap-2 pt-1.5 border-t text-[11px] ${
                            isTransferAccepted
                              ? 'border-emerald-200/60'
                              : isTransferRejected
                              ? 'border-rose-200/60'
                              : 'border-amber-200/60'
                          }`}>
                            <span className={`font-medium shrink-0 ${
                              isTransferAccepted
                                ? 'text-emerald-800'
                                : isTransferRejected
                                ? 'text-rose-800'
                                : 'text-amber-800'
                            }`}>مسار النقل:</span>
                            
                            <div className="flex items-center gap-1.5 font-bold flex-wrap justify-end">
                              {/* من: الحلقة الحالية */}
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-500 font-normal">من:</span>
                                <span className="bg-white px-2 py-0.5 rounded text-slate-700 border border-slate-200 shadow-2xs">
                                  {notif.data.currentCircleName || 'بدون حلقة'}
                                </span>
                              </div>

                              {/* سهم يشير باتجاه اليسار (الاتجاه الصحيح في القراءة العربية من اليمين لليسار) */}
                              <ArrowLeft className={`w-3.5 h-3.5 shrink-0 ${
                                isTransferAccepted
                                  ? 'text-emerald-600'
                                  : isTransferRejected
                                  ? 'text-rose-600'
                                  : 'text-amber-600'
                              }`} />

                              {/* إلى: الحلقة المستهدفة */}
                              <div className="flex items-center gap-1">
                                <span className={`text-[10px] font-normal ${
                                  isTransferRejected ? 'text-rose-700' : 'text-emerald-700'
                                }`}>إلى:</span>
                                <span className={`px-2 py-0.5 rounded border shadow-2xs ${
                                  isTransferRejected
                                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                }`}>
                                  {notif.data.targetCircleName}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Extra Data Badges */}
                      {notif.data && !isTransferRelated && (
                        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                          {notif.data.rating && (
                            <span className="bg-white/80 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                              التقدير: {notif.data.rating}
                            </span>
                          )}
                          {notif.data.xpReward && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              +{notif.data.xpReward} XP
                            </span>
                          )}
                          {notif.data.nodeTitle && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                              {notif.data.nodeTitle}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Interactive Actions for Circle Transfer Request (For Teachers) */}
                      {isTransferRequest && (
                        <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between gap-2">
                          {transferStatus === 'pending' ? (
                            isTeacher ? (
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                  id={`accept-transfer-${notif.id}`}
                                  disabled={processingId === notif.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRespondTransfer(notif.id, 'accept');
                                  }}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-[#006304] hover:bg-[#004d03] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {processingId === notif.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                  <span>قبول</span>
                                </button>
                                <button
                                  id={`reject-transfer-${notif.id}`}
                                  disabled={processingId === notif.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRespondTransfer(notif.id, 'reject');
                                  }}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>رفض</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-700 font-bold bg-amber-100/70 px-2.5 py-1 rounded-md">
                                قيد مراجعة المعلم ⏳
                              </span>
                            )
                          ) : transferStatus === 'accepted' ? (
                            <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              تم قبول طلب النقل بنجاح
                            </span>
                          ) : (
                            <span className="text-[11px] text-rose-800 font-bold bg-rose-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              تم رفض طلب النقل
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button
            onClick={() => setIsNotificationsModalOpen(false)}
            className="w-full py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
};
