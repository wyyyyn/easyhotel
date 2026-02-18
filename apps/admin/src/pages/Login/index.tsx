import { Form, Input, Button, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@easyhotel/api-client';
import { UserRole, type LoginDto } from '@easyhotel/shared';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './index.module.css';

const { Title } = Typography;

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [form] = Form.useForm();

  const handleSubmit = async (values: LoginDto) => {
    try {
      const res = await authApi.login(values);
      login(res);
      message.success('登录成功');

      // 根据角色跳转
      if (res.user.role === UserRole.ADMIN) {
        navigate('/admin/reviews');
      } else {
        navigate('/merchant/hotels');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      message.error(errorMessage);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Title level={3} className={styles.title}>
          EasyHotel 管理端
        </Title>
        <Form
          form={form}
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
          <Form.Item className={styles.linkItem}>
            还没有账号？ <Link to="/register">立即注册</Link>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
