import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Badge,
  Tabs,
  message,
  Modal,
  Input,
  Typography,
  Timeline,
  Tag,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  StopOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminApi } from '@easyhotel/api-client';
import {
  type Hotel,
  type ReviewLog,
  HotelStatus,
  HOTEL_STATUS_LABELS,
  STAR_LEVEL_LABELS,
  DEFAULT_PAGE_SIZE,
  type StarLevel,
} from '@easyhotel/shared';
import styles from './index.module.css';

const { Title } = Typography;
const { TextArea } = Input;

const statusBadgeMap: Record<HotelStatus, 'default' | 'processing' | 'success' | 'error' | 'warning'> = {
  [HotelStatus.DRAFT]: 'default',
  [HotelStatus.PENDING]: 'processing',
  [HotelStatus.APPROVED]: 'success',
  [HotelStatus.REJECTED]: 'error',
  [HotelStatus.OFFLINE]: 'warning',
};

const tabItems = [
  { key: '', label: '全部' },
  { key: HotelStatus.PENDING, label: '待审核' },
  { key: HotelStatus.APPROVED, label: '已通过' },
  { key: HotelStatus.REJECTED, label: '已拒绝' },
  { key: HotelStatus.OFFLINE, label: '已下线' },
];

export default function ReviewList() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [currentHotelId, setCurrentHotelId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);
  const [reviewLogs, setReviewLogs] = useState<Record<number, ReviewLog[]>>({});

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReviewList({
        page,
        pageSize,
        status: statusFilter || undefined,
      });
      setHotels(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '获取审核列表失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleAction = async (
    hotelId: number,
    action: 'APPROVE' | 'REJECT' | 'OFFLINE' | 'ONLINE',
    reason?: string,
  ) => {
    setActionLoading(true);
    try {
      await adminApi.reviewAction({ hotelId, action, reason });
      message.success('操作成功');
      fetchReviews();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '操作失败';
      message.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (hotelId: number) => {
    Modal.confirm({
      title: '确认通过',
      content: '确定通过该酒店的审核？',
      onOk: () => handleAction(hotelId, 'APPROVE'),
    });
  };

  const openRejectModal = (hotelId: number) => {
    setCurrentHotelId(hotelId);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('请输入拒绝原因');
      return;
    }
    if (currentHotelId) {
      await handleAction(currentHotelId, 'REJECT', rejectReason);
      setRejectModalVisible(false);
    }
  };

  const handleOffline = (hotelId: number) => {
    Modal.confirm({
      title: '确认下线',
      content: '确定将该酒店下线？',
      onOk: () => handleAction(hotelId, 'OFFLINE'),
    });
  };

  const handleOnline = (hotelId: number) => {
    Modal.confirm({
      title: '确认上线',
      content: '确定将该酒店重新上线？',
      onOk: () => handleAction(hotelId, 'ONLINE'),
    });
  };

  const handleExpand = async (expanded: boolean, record: Hotel) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.id]);
      if (!reviewLogs[record.id]) {
        try {
          const logs = await adminApi.getReviewLogs(record.id);
          setReviewLogs((prev) => ({ ...prev, [record.id]: logs }));
        } catch {
          message.error('获取审核日志失败');
        }
      }
    } else {
      setExpandedRowKeys(expandedRowKeys.filter((k) => k !== record.id));
    }
  };

  const columns: ColumnsType<Hotel> = [
    {
      title: '酒店名称',
      dataIndex: 'nameZh',
      key: 'nameZh',
      ellipsis: true,
    },
    {
      title: '商户ID',
      dataIndex: 'merchantId',
      key: 'merchantId',
      width: 100,
    },
    {
      title: '星级',
      dataIndex: 'starLevel',
      key: 'starLevel',
      width: 100,
      render: (level: StarLevel) => STAR_LEVEL_LABELS[level] || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: HotelStatus) => (
        <Badge
          status={statusBadgeMap[status]}
          text={HOTEL_STATUS_LABELS[status]}
        />
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_, record) => (
        <Space size="small">
          {record.status === HotelStatus.PENDING && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
                loading={actionLoading}
              >
                通过
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => openRejectModal(record.id)}
                loading={actionLoading}
              >
                拒绝
              </Button>
            </>
          )}
          {record.status === HotelStatus.APPROVED && (
            <Button
              size="small"
              icon={<StopOutlined />}
              onClick={() => handleOffline(record.id)}
              loading={actionLoading}
            >
              下线
            </Button>
          )}
          {record.status === HotelStatus.OFFLINE && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleOnline(record.id)}
              loading={actionLoading}
            >
              上线
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderReviewLogs = (record: Hotel) => {
    const logs = reviewLogs[record.id];
    if (!logs) {
      return <div style={{ padding: 16 }}>加载中...</div>;
    }
    if (logs.length === 0) {
      return <div style={{ padding: 16 }}>暂无审核日志</div>;
    }
    return (
      <div style={{ padding: '8px 16px' }}>
        <Timeline
          items={logs.map((log) => ({
            color:
              log.toStatus === HotelStatus.APPROVED
                ? 'green'
                : log.toStatus === HotelStatus.REJECTED
                  ? 'red'
                  : 'blue',
            children: (
              <div>
                <Space>
                  <Tag>{HOTEL_STATUS_LABELS[log.fromStatus]}</Tag>
                  <span>-&gt;</span>
                  <Tag
                    color={
                      log.toStatus === HotelStatus.APPROVED
                        ? 'success'
                        : log.toStatus === HotelStatus.REJECTED
                          ? 'error'
                          : 'default'
                    }
                  >
                    {HOTEL_STATUS_LABELS[log.toStatus]}
                  </Tag>
                </Space>
                {log.reason && (
                  <div style={{ marginTop: 4, color: '#666' }}>
                    原因：{log.reason}
                  </div>
                )}
                <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                  {new Date(log.createdAt).toLocaleString('zh-CN')}
                </div>
              </div>
            ),
          }))}
        />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Title level={4} style={{ margin: 0 }}>审核管理</Title>

      <Tabs
        activeKey={statusFilter}
        onChange={(key) => {
          setStatusFilter(key);
          setPage(1);
        }}
        items={tabItems}
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={hotels}
        loading={loading}
        expandable={{
          expandedRowKeys,
          onExpand: handleExpand,
          expandedRowRender: renderReviewLogs,
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Modal
        title="拒绝原因"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={actionLoading}
      >
        <TextArea
          rows={4}
          placeholder="请输入拒绝原因"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>
    </div>
  );
}
