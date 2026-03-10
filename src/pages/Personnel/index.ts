import { createElement } from 'react';
import PersonnelDetail from './PersonnelDetail';
import PersonnelForm from './PersonnelForm';
import PersonnelList from './PersonnelList';

export const StudentListPage = () => createElement(PersonnelList, { role: 'student' });

export const StudentCreatePage = () => createElement(PersonnelForm, { role: 'student' });

export const StudentDetailPage = () => createElement(PersonnelDetail, { role: 'student' });

export const StudentEditPage = () => createElement(PersonnelForm, { role: 'student' });

export const TeacherListPage = () => createElement(PersonnelList, { role: 'teacher' });

export const TeacherCreatePage = () => createElement(PersonnelForm, { role: 'teacher' });

export const TeacherDetailPage = () => createElement(PersonnelDetail, { role: 'teacher' });

export const TeacherEditPage = () => createElement(PersonnelForm, { role: 'teacher' });
