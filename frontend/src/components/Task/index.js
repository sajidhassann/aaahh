import {
  Table,
  Space,
  Card,
  Button,
  Form,
  Drawer,
  Row,
  Col,
  Input,
  DatePicker,
  Select,
  Tooltip,
  Upload,
} from 'antd';
import { useEffect, useState } from 'react';
import { BsPencil, BsTrash } from 'react-icons/bs';
import { connect } from 'react-redux';
import useToggle from '../../Hooks/useToggle';
import {
  getTasks,
  selectTask,
  updateTask,
  deleteTask,
  addTask,
} from '../../redux/actions/task';
import { getProjects } from '../../redux/actions/project';
import axios from 'axios';
import moment from '../../../node_modules/moment';
import { AiOutlineCloudUpload } from 'react-icons/ai';
const { Option } = Select;
const { RangePicker } = DatePicker;
const now = moment();
const Task = ({
  role,
  projects,
  team,
  list,
  getTasks,
  selectTask,
  updateTask,
  deleteTask,
  addTask,
  getProjects,
  selected,
}) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      ellipsis: true,
      render: (project) => project.name,
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      ellipsis: true,
      render: (assignee) => assignee.name,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      ellipsis: true,
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      ellipsis: true,
    },
    {
      title: 'Attachment',
      dataIndex: 'attachment',
      key: 'attachment',
      ellipsis: true,
      render: (attachment) =>
        attachment ? (
          <a
            className='ant-btn text-decoration-none'
            target='_blank'
            rel='noreferrer'
            download={attachment?.name}
            href={attachment?.path}
          >
            View
          </a>
        ) : (
          <p className='text-center'>N/A</p>
        ),
    },
    {
      title: 'Delivery Attachment',
      dataIndex: 'deliveryAttachment',
      key: 'deliveryAttachment',
      ellipsis: true,
      render: (deliveryAttachment) =>
        deliveryAttachment ? (
          <a
            className='ant-btn text-decoration-none'
            target='_blank'
            rel='noreferrer'
            download={deliveryAttachment?.name}
            href={deliveryAttachment?.path}
          >
            View
          </a>
        ) : (
          <p className='text-center'>N/A</p>
        ),
    },
    {
      title: 'Completed At',
      dataIndex: 'completedAt',
      key: 'completedAt',
      ellipsis: true,
      render: (text) => text?.split('T')[0].split('-').reverse().join('-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      ellipsis: true,
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <Space size='middle'>
          <Tooltip placement='left' title='Edit'>
            <Button
              onClick={() => {
                selectTask(record);
                toggle();
              }}
              icon={<BsPencil className='text-primary' />}
            />
          </Tooltip>
          {role === 'Lead' && (
            <Tooltip placement='right' title='Delete'>
              <Button
                onClick={() => deleteTask(record._id)}
                danger
                icon={<BsTrash className='text-danger' />}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const [visible, toggle] = useToggle(false);
  const [filtered, setFiltered] = useState(undefined);

  const onSearch = (txt) => {
    if (txt) {
      setFiltered(
        list.filter((item) => {
          const regex = new RegExp(`${txt}`, 'gi');
          return (
            item?.name?.match(regex) ||
            item?.status?.match(regex) ||
            item?.description?.match(regex) ||
            item?.assignee?.name?.match(regex) ||
            item?.reporter?.name?.match(regex)
          );
        })
      );
    } else {
      setFiltered(undefined);
    }
  };
  useEffect(() => {
    getTasks(role);
    if (role === 'Lead') getProjects(team);
    // if (role === 'Lead') getEmployees();
    return () => {};
  }, []);
  return (
    <>
      <Card
        title='Tasks'
        hoverable
        extra={
          <>
            <Input
              type='search'
              placeholder='Search task'
              style={{ width: 200 }}
              allowClear
              onChange={(e) => {
                onSearch(e.currentTarget.value);
              }}
            />
            {role === 'Lead' && (
              <Button onClick={toggle} type='primary' className='ms-2'>
                Add Task
              </Button>
            )}
          </>
        }
      >
        <Table
          pagination={{ pageSize: 10 }}
          columns={columns}
          dataSource={filtered || list}
        />
      </Card>
      <TaskForm
        visible={visible}
        toggle={() => {
          toggle();
          selectTask(undefined);
        }}
        role={role}
        projects={projects}
        team={team}
        selected={selected}
        updateTask={updateTask}
        addTask={role === 'Lead' ? addTask : () => {}}
      />
    </>
  );
};

const TaskForm = ({
  visible,
  role,
  projects,
  team,
  toggle,
  selected,
  updateTask,
  addTask,
}) => {
  const [loading, toggleLoading] = useToggle(false);
  const onFinish = async (values) => {
    console.log('Success:', values);
    const { dates, attachment, ...rest } = values;
    const formData = new FormData();
    if (role === 'Lead') {
      for (let key of Object.keys(rest)) {
        formData.append(key, rest[key]);
      }
      formData.append('attachment', attachment?.file);
      formData.append('startDate', dates[0].format('DD-MM-YYYY'));
      formData.append('endDate', dates[1].format('DD-MM-YYYY'));
      if (selected) formData.append('_id', selected._id);
    } else {
      formData.append('attachment', attachment?.file);
      formData.append('status', statusState);
      if (selected) formData.append('_id', selected._id);
    }
    toggleLoading();
    selected && role === 'Lead'
      ? await updateTask(formData)
      : selected
      ? await updateTask(formData)
      : await addTask(formData);
    toggleLoading();
    toggle();
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const [members, setMembers] = useState([]);
  const getMembers = async () => {
    try {
      const res = await axios.get('/api/users/members/team/' + team);
      setMembers(res.data);
    } catch (err) {
      console.log({ err });
    }
  };
  useEffect(() => {
    if (visible) getMembers();
    return () => {
      setStatus('');
    };
  }, [visible]);
  let {
    assignee,
    project,
    reporter,
    status,
    _id,
    startDate,
    endDate,
    ...rest
  } = selected || {};

  const [statusState, setStatus] = useState(status);

  return (
    <Drawer
      title={selected ? 'Edit Task' : 'Add Task'}
      width={720}
      onClose={toggle}
      visible={visible}
      bodyStyle={{ paddingBottom: 80 }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      destroyOnClose={true}
      footer={
        <Space className='float-end'>
          <Button disabled={loading} onClick={toggle}>
            Cancel
          </Button>
          <Button
            htmlType='submit'
            form='task-form'
            key='submit'
            type='primary'
            loading={loading}
          >
            Submit
          </Button>
        </Space>
      }
    >
      <Form
        name='task-form'
        layout='vertical'
        hideRequiredMark
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        initialValues={
          role === 'Lead'
            ? {
                _id,
                ...rest,
                assignee: assignee?._id,
                project: project?._id,
                dates: [
                  moment(startDate?.split('-').reverse().join('-')),
                  moment(endDate?.split('-').reverse().join('-')),
                ],
              }
            : { status, _id }
        }
      >
        {role === 'Lead' ? (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name='name'
                  label='Name'
                  rules={[{ required: true, message: 'Please enter name' }]}
                >
                  <Input placeholder='Please enter name' />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='assignee'
                  label='Assignee'
                  rules={[
                    { required: true, message: 'Please select an employee' },
                  ]}
                >
                  <Select
                    allowClear
                    showSearch
                    placeholder='Select a assignee'
                    optionFilterProp='children'
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {members?.map(({ _id, name }) => (
                      <Option key={_id} value={_id}>
                        {name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name='project'
                  label='Project'
                  rules={[
                    { required: true, message: 'Please select an employee' },
                  ]}
                >
                  <Select
                    allowClear
                    showSearch
                    placeholder='Select a project'
                    optionFilterProp='children'
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {projects?.map(({ _id, name }) => (
                      <Option key={_id} value={_id}>
                        {name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name='dates'
                  label='Date Range'
                  rules={[{ required: true, message: 'Please select dates' }]}
                >
                  <RangePicker
                    format='DD-MM-YYYY'
                    className='w-100'
                    disabledDate={(current) => {
                      return current?.isBefore(now, 'day');
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name='attachment'
                  label='Attachment'
                  rules={[
                    {
                      required: false,
                      message: 'please attach',
                    },
                  ]}
                >
                  <Upload
                    className='w-100'
                    style={{ width: '100%' }}
                    maxCount={1}
                    beforeUpload={() => false}
                  >
                    <Button
                      className='w-100'
                      icon={
                        <AiOutlineCloudUpload size={20} className='me-1 mb-1' />
                      }
                    >
                      Select File
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name='description'
                  label='Description'
                  rules={[
                    {
                      required: true,
                      message: 'please enter description',
                    },
                  ]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder='please enter description'
                  />
                </Form.Item>
              </Col>
            </Row>
          </>
        ) : (
          <>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name='status'
                  label='Status'
                  rules={[
                    { required: true, message: 'Please select a status' },
                  ]}
                >
                  <Select
                    onChange={setStatus}
                    value={statusState}
                    allowClear
                    showSearch
                    placeholder='Select a status'
                    optionFilterProp='children'
                    filterOption={(input, option) =>
                      option.children
                        .toLowerCase()
                        .indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {['To do', 'In Progress', 'Completed']?.map((v) => (
                      <Option key={v} value={v}>
                        {v}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            {statusState === 'Completed' && (
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name='attachment'
                    label='Delivery Attachment'
                    rules={[
                      {
                        required: false,
                        message: 'please attach',
                      },
                    ]}
                  >
                    <Upload
                      className='w-100'
                      style={{ width: '100%' }}
                      maxCount={1}
                      beforeUpload={() => false}
                    >
                      <Button
                        className='w-100'
                        icon={
                          <AiOutlineCloudUpload
                            size={20}
                            className='me-1 mb-1'
                          />
                        }
                      >
                        Select File
                      </Button>
                    </Upload>
                  </Form.Item>
                </Col>
              </Row>
            )}
          </>
        )}
      </Form>
    </Drawer>
  );
};
const mapStateToProps = ({
  user: { user: { role, team } = {} },
  task: { list, selected },
  project: { list: projects },
}) => ({
  role,
  team,
  list,
  selected,
  projects,
});
export default connect(mapStateToProps, {
  getTasks,
  selectTask,
  updateTask,
  deleteTask,
  addTask,
  getProjects,
})(Task);
