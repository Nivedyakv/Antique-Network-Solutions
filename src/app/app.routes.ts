import { Routes } from '@angular/router';
import { Home } from './features/home/home';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: Home,
    },
    {
        path: 'task-1',
        loadComponent: () =>
            import('./features/task-one/task-one').then(m => m.TaskOne),
    },
    {
        path: 'task-2',
        loadComponent: () =>
            import('./features/task-two/task-two').then(m => m.TaskTwo),
    },
    {
        path: '**',
        redirectTo: '',
    },
];