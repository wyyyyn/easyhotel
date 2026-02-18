import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AppLayout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import RoleGuard from '@/components/RoleGuard';
import HotelList from '@/pages/merchant/HotelList';
import HotelForm from '@/pages/merchant/HotelForm';
import ReviewList from '@/pages/admin/ReviewList';
import { UserRole } from '@easyhotel/shared';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 商户路由 */}
        <Route
          path="/merchant"
          element={
            <AuthGuard>
              <RoleGuard role={UserRole.MERCHANT}>
                <AppLayout />
              </RoleGuard>
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="hotels" replace />} />
          <Route path="hotels" element={<HotelList />} />
          <Route path="hotels/create" element={<HotelForm />} />
          <Route path="hotels/:id/edit" element={<HotelForm />} />
        </Route>

        {/* 管理员路由 */}
        <Route
          path="/admin"
          element={
            <AuthGuard>
              <RoleGuard role={UserRole.ADMIN}>
                <AppLayout />
              </RoleGuard>
            </AuthGuard>
          }
        >
          <Route index element={<Navigate to="reviews" replace />} />
          <Route path="reviews" element={<ReviewList />} />
        </Route>

        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
