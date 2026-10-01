import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessageComposer } from './message-composer/message-composer';

import {
  Breadcrumb,
  BreadcrumbItem,
} from '../../shared/components/breadcrumb/breadcrumb';

@Component({
  selector: 'app-task-one',
  standalone: true,
  imports: [RouterLink, Breadcrumb, MessageComposer],
  templateUrl: './task-one.html',
  styleUrl: './task-one.css',
})
export class TaskOne {
  readonly breadcrumbs: readonly BreadcrumbItem[] = [
    {
      label: 'Send Marketing Message',
      route: '/',
    },
    {
      label: 'Compose Message',
    },
  ];

  readonly templateDetails = [
    {
      label: 'Template Name',
      value: 'Diwali Sale',
    },
    {
      label: 'Template ID',
      value: '5798525851493',
    },
    {
      label: 'Message Type',
      value: 'Text and Rich Media',
    },
    {
      label: 'Language',
      value: 'English',
    },
  ];
}