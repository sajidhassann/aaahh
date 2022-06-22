import { Card } from 'antd';
import { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import { connect } from 'react-redux';
import { getTasks } from '../../redux/actions/task';

const TaskGanttChart = ({ getTasks, role, list }) => {
  const [charts, setCharts] = useState([]);
  useEffect(() => {
    getTasks(role);
    return () => {};
  }, []);

  useEffect(() => {
    const groupByProjects = list.reduce((result, task) => {
      result[task?.project?._id] = result[task?.project?._id] || [];
      result[task?.project?._id].push(task);
      return result;
    }, {});

    setCharts(
      Object.values(groupByProjects).map((task) => ({
        name: task[0]?.project?.name,
        data: [
          [
            { type: 'string', label: 'Task ID' },
            { type: 'string', label: 'Task Name' },
            { type: 'string', label: 'Resource' },
            { type: 'date', label: 'Start Date' },
            { type: 'date', label: 'End Date' },
            { type: 'number', label: 'Duration' },
            { type: 'number', label: 'Percent Complete' },
            { type: 'string', label: 'Dependencies' },
          ],
          ...task.map(
            (
              { _id, name, assignee: { name: dev } = {}, startDate, endDate },
              i
            ) => [
              _id,
              name,
              dev,
              new Date(startDate?.split('-').reverse().join('-')),
              new Date(endDate?.split('-').reverse().join('-')),
              null,
              10 * (i + 1),
              null,
            ]
          ),
        ],
      }))
    );

    console.log({ groupByProjects });
    return () => {};
  }, [list]);

  console.log({ charts });
  return (
    <>
      {charts.map((chart) => (
        <Card
          title={`${chart?.name?.toUpperCase?.()} - Tasks - Gantt Chart`}
          hoverable
          className='mb-5'
        >
          <Chart
            width={'100%'}
            height={'100%'}
            chartType='Gantt'
            loader={<div>Loading Chart</div>}
            data={chart?.data}
            options={{
              height: 400,
              gantt: {
                trackHeight: 50,
                barHeight: 40,
              },
            }}
            rootProps={{ 'data-testid': '2' }}
          />
        </Card>
      ))}
    </>
  );
};

const mapStateToProps = ({
  user: { user: { role } = {} },
  task: { list },
}) => ({
  role,
  list,
});
export default connect(mapStateToProps, { getTasks })(TaskGanttChart);
