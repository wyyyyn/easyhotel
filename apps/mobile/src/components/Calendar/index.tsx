import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import {
  formatDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  calcNights,
} from '@easyhotel/shared';
import './index.scss';

interface CalendarProps {
  visible: boolean;
  onConfirm: (range: { checkIn: string; checkOut: string }) => void;
  onClose: () => void;
  initialCheckIn?: string;
  initialCheckOut?: string;
}

interface DayInfo {
  date: Date;
  dateStr: string;
  day: number;
  isToday: boolean;
  isWeekend: boolean;
  isPast: boolean;
  isEmpty: boolean; // 占位空格
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_COUNT = 6; // 当前月 + 后 5 个月

function Calendar({
  visible,
  onConfirm,
  onClose,
  initialCheckIn,
  initialCheckOut,
}: CalendarProps) {
  const [checkIn, setCheckIn] = useState<string | null>(initialCheckIn || null);
  const [checkOut, setCheckOut] = useState<string | null>(
    initialCheckOut || null,
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = useMemo(() => formatDate(today), [today]);

  // 生成月份数据
  const months = useMemo(() => {
    const result: {
      year: number;
      month: number;
      label: string;
      days: DayInfo[];
    }[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    for (let i = 0; i < MONTH_COUNT; i++) {
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      const month = (currentMonth + i) % 12;
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      const label = `${year}年${month + 1}月`;

      const days: DayInfo[] = [];

      // 填充前面的空白日期
      for (let j = 0; j < firstDay; j++) {
        days.push({
          date: new Date(),
          dateStr: '',
          day: 0,
          isToday: false,
          isWeekend: false,
          isPast: false,
          isEmpty: true,
        });
      }

      // 填充实际日期
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        date.setHours(0, 0, 0, 0);
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        const isPast = date.getTime() < today.getTime();

        days.push({
          date,
          dateStr,
          day: d,
          isToday: dateStr === todayStr,
          isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
          isPast,
          isEmpty: false,
        });
      }

      result.push({ year, month, label, days });
    }

    return result;
  }, [today, todayStr]);

  // 夜数
  const nights = useMemo(() => {
    if (checkIn && checkOut) {
      return calcNights(checkIn, checkOut);
    }
    return 0;
  }, [checkIn, checkOut]);

  // 判断是否在选中范围内
  const isInRange = useCallback(
    (dateStr: string) => {
      if (!checkIn || !checkOut) return false;
      return dateStr > checkIn && dateStr < checkOut;
    },
    [checkIn, checkOut],
  );

  // 点击日期
  const handleDayClick = useCallback(
    (dayInfo: DayInfo) => {
      if (dayInfo.isEmpty || dayInfo.isPast) return;
      const { dateStr } = dayInfo;

      if (!checkIn || (checkIn && checkOut)) {
        // 没有选入住日期 或 两个都选了则重新选
        setCheckIn(dateStr);
        setCheckOut(null);
      } else {
        // 已选入住日期，选退房日期
        if (dateStr <= checkIn) {
          // 如果选的比入住日期早或相同，则重新选入住
          setCheckIn(dateStr);
          setCheckOut(null);
        } else {
          setCheckOut(dateStr);
        }
      }
    },
    [checkIn, checkOut],
  );

  // 确认
  const handleConfirm = useCallback(() => {
    if (checkIn && checkOut) {
      onConfirm({ checkIn, checkOut });
    }
  }, [checkIn, checkOut, onConfirm]);

  if (!visible) return null;

  return (
    <View className="calendar-overlay" onClick={onClose}>
      <View className="calendar-container" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <View className="calendar-header">
          <Text className="calendar-header__title">选择日期</Text>
          <View className="calendar-header__close" onClick={onClose}>
            <Text className="calendar-header__close-icon">×</Text>
          </View>
        </View>

        {/* 星期栏 */}
        <View className="calendar-weekdays">
          {WEEKDAYS.map((w, i) => (
            <View
              key={w}
              className={`calendar-weekdays__item ${i === 0 || i === 6 ? 'calendar-weekdays__item--weekend' : ''}`}
            >
              <Text>{w}</Text>
            </View>
          ))}
        </View>

        {/* 月份列表 */}
        <ScrollView
          className="calendar-body"
          scrollY
          enhanced
          showScrollbar={false}
        >
          {months.map((monthData) => (
            <View
              key={`${monthData.year}-${monthData.month}`}
              className="calendar-month"
            >
              <View className="calendar-month__title">
                <Text>{monthData.label}</Text>
              </View>
              <View className="calendar-month__grid">
                {monthData.days.map((dayInfo, idx) => {
                  if (dayInfo.isEmpty) {
                    return (
                      <View
                        key={`empty-${idx}`}
                        className="calendar-day calendar-day--empty"
                      />
                    );
                  }

                  const isCheckIn = dayInfo.dateStr === checkIn;
                  const isCheckOut = dayInfo.dateStr === checkOut;
                  const isRange = isInRange(dayInfo.dateStr);

                  let dayClass = 'calendar-day';
                  if (dayInfo.isPast) dayClass += ' calendar-day--disabled';
                  if (isCheckIn) dayClass += ' calendar-day--start';
                  if (isCheckOut) dayClass += ' calendar-day--end';
                  if (isRange) dayClass += ' calendar-day--range';
                  if (dayInfo.isWeekend && !isCheckIn && !isCheckOut && !isRange)
                    dayClass += ' calendar-day--weekend';

                  return (
                    <View
                      key={dayInfo.dateStr}
                      className={dayClass}
                      onClick={() => handleDayClick(dayInfo)}
                    >
                      <Text className="calendar-day__number">
                        {dayInfo.day}
                      </Text>
                      {dayInfo.isToday && !isCheckIn && (
                        <Text className="calendar-day__label">今天</Text>
                      )}
                      {isCheckIn && (
                        <Text className="calendar-day__label">入住</Text>
                      )}
                      {isCheckOut && (
                        <Text className="calendar-day__label">退房</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* 底部确认 */}
        <View className="calendar-footer safe-bottom">
          {nights > 0 ? (
            <View
              className="calendar-footer__btn calendar-footer__btn--active"
              onClick={handleConfirm}
            >
              <Text className="calendar-footer__btn-text">
                确定（共{nights}晚）
              </Text>
            </View>
          ) : (
            <View className="calendar-footer__btn calendar-footer__btn--disabled">
              <Text className="calendar-footer__btn-text">请选择日期</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default Calendar;
