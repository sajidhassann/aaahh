import { Table, Card, Button, DatePicker } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';
import moment from '../../../node_modules/moment';

const { RangePicker } = DatePicker;
const now = moment();
const Attendance = ({ match: { params: { user } = {} } = {} }) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'user',
      key: 'user',
      ellipsis: true,
      render: (user) => user?.name,
    },
    {
      title: 'Email',
      dataIndex: 'user',
      key: 'user',
      ellipsis: true,
      render: (user) => user?.email,
    },
    {
      title: 'Department',
      dataIndex: 'user',
      key: 'user',
      ellipsis: true,
      render: (user) => user?.department?.name,
    },
    {
      title: 'Role',
      dataIndex: 'user',
      key: 'user',
      ellipsis: true,
      render: (user) => user?.role,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      ellipsis: true,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      ellipsis: true,
      render: (date) => moment(date).format('DD-MMM-YYYY HH:MM A'),
    },
  ];
  const [list, setList] = useState(undefined);

  const getAttendance = async (startDate, endDate) => {
    try {
      const res = await axios.get(
        `/api/attendance/${user}?startDate=${startDate}&endDate=${endDate}`
      );
      const { data } = res;
      setList(data);
      console.log({ data });
    } catch (err) {}
  };

  useEffect(() => {
    getAttendance(now.format('YYYY-MM-DD'), now.format('YYYY-MM-DD'));
    return () => {};
  }, []);
  return (
    <>
      <Card
        title='Employee Attendance'
        hoverable
        extra={
          <>
            <RangePicker
              allowClear
              showToday
              hideDisabledOptions
              format='DD-MM-YYYY'
              className='w-100'
              onChange={(dates) =>
                dates &&
                getAttendance(
                  dates[0].format('YYYY-MM-DD'),
                  dates[1].format('YYYY-MM-DD')
                )
              }
              disabledDate={(current) => {
                return current?.isAfter(now, 'd');
              }}
            />
          </>
        }
      >
        <Table
          pagination={{ pageSize: 10 }}
          columns={columns}
          dataSource={list}
        />
      </Card>
    </>
  );
};

export default Attendance;
