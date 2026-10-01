# Antique Network Solution

Welcome to the **Antique Network Solution** project! This application provides a modern and responsive user interface built for robust contact management and communication functionalities.

## 📖 Overview

The Antique Network Solution is an intuitive and scalable web application that offers:
- **Contact Management & Directory**: Create, view, and organize contacts with features like pagination and quick resets.
- **Messaging Integration**: Compose and send messages using a streamlined, interactive custom user interface.
- **Modern User Experience**: Features customized dialogs, dynamic layouts, and integrated scalable vector graphics (like Heroicons).

## 🚀 Getting Started

### Prerequisites

Before starting, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Angular CLI](https://github.com/angular/angular-cli) (version 22+)

### Installation

1. Navigate to the project directory:
   ```bash
   cd Antique-Network-Solution
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```

### 🏃‍♂️ Startup Instructions

To start the application and test the local development server using the production build configuration, run the following command:

```bash
ng serve --configuration production
```

Once the development server is up and running, open your browser and navigate to `http://localhost:4200/`.

By running with `--configuration production`, you can ensure that you are locally previewing the application exactly as it would behave and perform in a live production environment.

## 🛠️ Development & Build

### Code Scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `directives`, `services`, or `pipes`), run `ng generate --help`.

### Building the Project

To build the project for deployment, simply run:

```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## 🧪 Testing

### Unit Tests
The project is configured to use [Vitest](https://vitest.dev/). Run unit testing by executing:

```bash
ng test
```

### End-to-End Tests
For end-to-end (e2e) testing, run:

```bash
ng e2e
```
*(Note: Angular CLI does not come with an E2E testing framework by default. Appropriate frameworks must be provided).*

## 📚 Technology Stack

- **[Angular](https://angular.dev/)** - Core Framework (v22.2.0)
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework (v4.3.3)
- **[Vitest](https://vitest.dev/)** - Testing framework
- **[RxJS](https://rxjs.dev/)** - Additions for reactive programming
