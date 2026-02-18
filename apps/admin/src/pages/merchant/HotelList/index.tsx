import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Badge, Select, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { hotelApi } from '@easyhotel/api-client';
import {
  type Hotel,
  HotelStatus,
  HOTEL_STATUS_LABELS,
  STAR_LEVEL_LABELS,
  DEFAULT_PAGE_SIZE,
  type StarLevel,
  formatPrice,
} from '@easyhotel/shared';
import styles from './index.module.css';

const { Title } = Typography;

const statusBadgeMap: Record<HotelStatus, 'default' | 'processing' | 'success' | 'error' | 'warning'> = {
  [HotelStatus.DRAFT]: 'default',
  [HotelStatus.PENDING]: 'processing',
  [HotelStatus.APPROVED]: 'success',
  [HotelStatus.REJECTED]: 'error',
  [HotelStatus.OFFLINE]: 'warning',
};

export default function HotelList() {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const fetchHotels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hotelApi.getMyHotels({ page, pageSize, status: statusFilter });
      setHotels(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '获取酒店列表失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleDelete = async (id: number) => {
    try {
      await hotelApi.delete(id);
      message.success('删除成功');
      fetchHotels();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '删除失败';
      message.error(errorMessage);
    }
  };

  const handleSubmitReview = async (id: number) => {
    try {
      await hotelApi.submitReview(id);
      message.success('已提交审核');
      fetchHotels();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '提交审核失败';
      message.error(errorMessage);
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
      title: '最低价',
      dataIndex: 'minPrice',
      key: 'minPrice',
      width: 100,
      render: (price: number | null) => (price != null ? formatPrice(price) : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/merchant/hotels/${record.id}/edit`)}
          >
            编辑
          </Button>
          {(record.status === HotelStatus.DRAFT || record.status === HotelStatus.REJECTED) && (
            <Popconfirm
              title="确定提交审核？"
              onConfirm={() => handleSubmitReview(record.id)}
            >
              <Button type="link" icon={<SendOutlined />}>
                提交审核
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确定删除该酒店？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={4} style={{ margin: 0 }}>我的酒店</Title>
        <Space>
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={Object.entries(HOTEL_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/merchant/hotels/create')}
          >
            新增酒店
          </Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={hotels}
        loading={loading}
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
    </div>
  );
}
