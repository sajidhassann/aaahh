import { Card } from 'antd';
import { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import { connect } from 'react-redux';
import { getProjects } from '../../redux/actions/project';

const GanttChart = ({ getProjects, role, list }) => {
  const [chart, setChart] = useState([
    [
      { type: 'string', label: 'Project ID' },
      { type: 'string', label: 'Project Name' },
      { type: 'string', label: 'Resource' },
      { type: 'date', label: 'Start Date' },
      { type: 'date', label: 'End Date' },
      { type: 'number', label: 'Duration' },
      { type: 'number', label: 'Percent Complete' },
      { type: 'string', label: 'Dependencies' },
    ],
  ]);
  useEffect(() => {
    getProjects(role);

    return () => {};
  }, []);
  useEffect(() => {
    setChart([
      [
        { type: 'string', label: 'Project ID' },
        { type: 'string', label: 'Project Name' },
        { type: 'string', label: 'Resource' },
        { type: 'date', label: 'Start Date' },
        { type: 'date', label: 'End Date' },
        { type: 'number', label: 'Duration' },
        { type: 'number', label: 'Percent Complete' },
        { type: 'string', label: 'Dependencies' },
      ],
      ...list.map(
        (
          {
            _id,
            name,
            assignee: { name: team, department: { name: depart } = {} } = {},
            startDate,
            endDate,
          },
          i
        ) => [
          _id,
          name,
          `${team} (${depart})`,
          new Date(startDate?.split('-').reverse().join('-')),
          new Date(endDate?.split('-').reverse().join('-')),
          null,
          10 * (i + 1),
          null,
        ]
      ),
    ]);
    return () => {};
  }, [list]);
  console.log({ chart });
  return (
    <>
      <Card title='Projects Gantt Chart' hoverable className='mb-5'>
        <Chart
          width={'100%'}
          height={'100%'}
          chartType='Gantt'
          loader={<div>Loading Chart</div>}
          data={chart}
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
    </>
  );
};

const mapStateToProps = ({
  user: { user: { role } = {} },
  project: { list },
}) => ({
  role,
  list,
});
export default connect(mapStateToProps, { getProjects })(GanttChart);
