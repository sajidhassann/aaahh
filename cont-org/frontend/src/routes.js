import {
  AiOutlinePieChart,
  AiOutlineFolder,
  AiOutlineUser,
  AiOutlineBlock,
  AiOutlineTeam,
  AiOutlineFile,
  AiOutlineWechat,
} from 'react-icons/ai';
import Chat from './components/Chat';
import Department from './components/Department';
import Employees from './components/Employees';
import Project from './components/Project';
import GanttChart from './components/GanttChart';
import Task from './components/Task';
import Team from './components/Team';
import TaskGanttChart from './components/TaskGanttChart';

export const nav = [
  {
    name: 'Departments',
    route: '/departments',
    Icon: AiOutlineBlock,
    roles: ['admin'],
    component: Department,
  },
  {
    name: 'Employees',
    route: '/employees',
    Icon: AiOutlineUser,
    roles: ['admin'],
    component: Employees,
  },
  {
    name: 'Teams',
    route: '/teams',
    Icon: AiOutlineTeam,
    roles: ['admin'],
    component: Team,
  },
  {
    name: 'Projects',
    route: '/projects',
    Icon: AiOutlineFolder,
    roles: ['admin', 'Lead'],
    component: Project,
  },
  {
    name: 'Tasks',
    route: '/tasks',
    Icon: AiOutlineFile,
    roles: ['Lead', 'Principal', 'Senior', 'Junior', 'Associate', 'Intern'],
    component: Task,
  },
  {
    name: 'GanttChart',
    route: '/gantt-chart',
    Icon: AiOutlinePieChart,
    roles: ['admin'],
    component: GanttChart,
  },
  {
    name: 'GanttChart',
    route: '/gantt-chart',
    Icon: AiOutlinePieChart,
    roles: ['Lead'],
    component: TaskGanttChart,
  },
  {
    name: 'Chat',
    route: '/chat',
    Icon: AiOutlineWechat,
    roles: [
      'admin',
      'Lead',
      'Principal',
      'Senior',
      'Junior',
      'Associate',
      'Intern',
    ],
    component: Chat,
  },
];
