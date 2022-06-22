import { Button, Card, Form, Input, Typography } from 'antd';
import { AiOutlineLock, AiOutlineMail } from 'react-icons/ai';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { login } from '../../redux/actions/user';
import Logo from '../../assets/cont-org-icon.png';
import Banner from '../../assets/banner.jpg';

const Login = ({ login, loading }) => {
  const onFinish = (values) => {
    console.log('Success:', values);
    login(values);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <div style={{ height: '100vh' }} className='d-flex align-items-center'>
      <img style={{ width: '65%' }} className='h-100' src={Banner} alt='logo' />
      <Card
        style={{ width: '35%' }}
        bodyStyle={{ width: '100%' }}
        className='h-100 d-flex align-items-center'
        hoverable
      >
        <img className='w-100' src={Logo} alt='logo' />
        <Form
          name='basic'
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
          <Form.Item className='d-flex align-items-center'>
            <Typography.Text>
              <Link to='forgetPassword'>Forgot Password</Link>
            </Typography.Text>
            <Button
              className='float-end w-50'
              type='primary'
              htmlType='submit'
              loading={loading}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

const mapStateToProps = ({ user: { loading } }) => ({
  loading,
});
const mapDispatchToProps = { login };
export default connect(mapStateToProps, mapDispatchToProps)(Login);
