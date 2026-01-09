# Career Co-pilot

Career Co-pilot is a full-stack web application designed to help users align their skills with the demands of the job market. It uses AI to parse CVs, analyze job descriptions, and create personalized learning roadmaps to help users bridge their skill gaps.

## Features

*   **CV Parsing:** Upload your CV in PDF format and the application will automatically extract your skills, work experience, and education using AI.
*   **AI-Powered Job Analysis:** Provide a URL to a job posting, and the application will scrape the content, analyze the requirements, and compare them against your profile.
*   **Skill Gap Analysis:** Get a detailed breakdown of which skills you have and which you need for a specific job, including a match score to see how well you fit the role.
*   **Gamified Learning Roadmap:** The application automatically generates a "Learning Quest" for each missing skill, with a list of tasks to help you learn.
*   **Progress Tracking:** Earn experience points (XP) and level up as you complete quests and assessments, making the learning process more engaging.
*   **User Profiles:** Create and manage your professional profile, including your bio, skills, and work experience.

## Tech Stack

*   **Frontend:**
    *   [React](https://react.dev/)
    *   [Vite](https://vitejs.dev/)
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [Tailwind CSS](https://tailwindcss.com/)
    *   [Shadcn/ui](https://ui.shadcn.com/)
*   **Backend:**
    *   [Node.js](https://nodejs.org/)
    *   [Express](https://expressjs.com/)
    *   [TypeScript](https://www.typescriptlang.org/)
*   **Database:**
    *   [PostgreSQL](https://www.postgresql.org/)
    *   [Drizzle ORM](https://orm.drizzle.team/)
*   **AI:**
    *   [OpenAI API](https://openai.com/blog/openai-api)

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/en/download/) (v20 or higher)
*   [npm](https://www.npmjs.com/get-npm)
*   [PostgreSQL](https://www.postgresql.org/download/)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/career-copilot.git
    cd career-copilot
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up the database:**

    *   Create a PostgreSQL database.
    *   Create a `.env` file in the `server` directory by copying the example:

        ```bash
        cp server/.env.example server/.env
        ```

    *   Update the `DATABASE_URL` in `server/.env` with your PostgreSQL connection string.

4.  **Set up the OpenAI API key:**

    *   Add your OpenAI API key to the `OPENAI_API_KEY` variable in `server/.env`.

5.  **Run database migrations:**

    ```bash
    npm run db:push
    ```

### Running the Application

*   **Start the development server:**

    ```bash
    npm run dev
    ```

    This will start the backend server on port 3000 and the frontend server on port 5000.

*   **Open the application:**

    Open your browser and navigate to `http://localhost:5000`.

## Available Scripts

*   `npm run dev:client`: Starts the Vite development server for the client.
*   `npm run dev`: Starts the backend server in development mode.
*   `npm run build`: Builds the application for production.
*   `npm run start`: Starts the application in production mode.
*   `npm run check`: Runs the TypeScript compiler to check for errors.
*   `npm run db:push`: Pushes database schema changes.
