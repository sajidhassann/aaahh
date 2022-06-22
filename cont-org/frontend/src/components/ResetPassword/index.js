import { useState } from 'react';
import { Button, Card, Form, Input, notification, Typography } from 'antd';
import axios from 'axios';
import Logo from '../../assets/cont-org-icon.png';
import { AiOutlineLock } from 'react-icons/ai';

const ResetPassword = ({ history: { push }, location: { pathname } }) => {
  const [loading, setLoading] = useState(false);
  const resetPassword = async ({ password }) => {
    try {
      const res = await axios.put('/api/auth/reset-password', {
        id: pathname.split('reset/')[1],
        password,
      });
      notification.success({ message: res.data.message });
      setTimeout(() => {
        push('/login');
      }, 2000);
    } catch (err) {
      console.log({ err });
      notification.error({ message: err.response.data.message });
    }
  };
  const onFinish = async (values) => {
    console.log('Success:', values);
    setLoading(true);
    await resetPassword(values);
    setLoading(false);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };
  return (
    <div style={{ height: '100vh' }} className='d-flex align-items-center'>
      <img className='w-50' src={Logo} alt='logo' />
      <Card
        className='w-50 h-100 d-flex justify-content-center align-items-center'
        bodyStyle={{ width: '75%' }}
        hoverable
      >
        <Typography.Title level={2} className='text-center'>
          Reset Password
        </Typography.Title>
        <Form
          name='reset-password'
          wrapperCol={{
            span: 24,
          }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            name='password'
            rules={[
              {
                required: true,
                message: 'Please input your password!',
              },
            ]}
          >
            <Input.Password
              prefix={<AiOutlineLock className='site-form-item-icon' />}
              placeholder='password'
            />
          </Form.Item>

          <Form.Item>
            <Button
              className='w-100'
              type='primary'
              htmlType='submit'
              loading={loading}
            >
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPassword;
