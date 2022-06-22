import { useState } from 'react';
import { Button, Card, Form, Input, notification, Typography } from 'antd';
import axios from 'axios';
import { AiOutlineMail } from 'react-icons/ai';
import Logo from '../../assets/cont-org-icon.png';

const ForgotPassword = ({ history: { push } }) => {
  const [loading, setLoading] = useState(false);
  const forgetPassword = async ({ email }) => {
    try {
      const res = await axios.post('/api/auth/forget-password', { email });
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
    await forgetPassword(values);
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
          Forgot Password
        </Typography.Title>
        <Form
          name='forget-password'
          wrapperCol={{
            span: 24,
          }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            name='email'
            rules={[
              {
                required: true,
                message: 'Please input your email!',
              },
            ]}
          >
            <Input
              type='email'
              prefix={<AiOutlineMail className='site-form-item-icon' />}
              placeholder='email'
            />
          </Form.Item>
          <Form.Item>
            <Button
              className='w-100'
              type='primary'
              htmlType='submit'
              loading={loading}
            >
              Send Email
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
