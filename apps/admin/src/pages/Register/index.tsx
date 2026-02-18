import { Form, Input, Button, Card, Radio, message, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@easyhotel/api-client';
import { UserRole } from '@easyhotel/shared';
import styles from './index.module.css';

const { Title } = Typography;

interface RegisterFormValues {
  username: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}

export default function Register() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      await authApi.register({
        username: values.username,
        password: values.password,
        role: values.role,
      });
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : '注册失败';
      message.error(errorMessage);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <Title level={3} className={styles.title}>
          注册账号
        </Title>
        <Form
          form={form}
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
          initialValues={{ role: UserRole.MERCHANT }}
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Radio.Group>
              <Radio value={UserRole.MERCHANT}>商户</Radio>
              <Radio value={UserRole.ADMIN}>管理员</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              注册
            </Button>
          </Form.Item>
          <Form.Item className={styles.linkItem}>
            已有账号？ <Link to="/login">返回登录</Link>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
