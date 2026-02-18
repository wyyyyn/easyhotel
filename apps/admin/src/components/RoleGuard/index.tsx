import type { ReactNode } from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '@easyhotel/shared';
import { useAuthStore } from '@/store/useAuthStore';

interface RoleGuardProps {
  role: UserRole;
  children: ReactNode;
}

export default function RoleGuard({ role, children }: RoleGuardProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user || user.role !== role) {
    return (
      <Result
        status="403"
        title="无权限"
        subTitle="抱歉，您没有权限访问此页面。"
        extra={
          <Button type="primary" onClick={() => navigate('/login')}>
            返回登录
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
}
