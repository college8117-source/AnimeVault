import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import { router } from './routes.js';
import { firebaseAuth } from './firebase.js';


const app = express();

const port =
  Number(process.env.PORT || 4000);


const frontendOrigin =
  process.env.FRONTEND_ORIGIN || '*';


/* =========================================================
   FIREBASE INITIALIZATION
========================================================= */

try {

  firebaseAuth();

  console.log(
    'Firebase Admin initialized successfully.'
  );

} catch (error) {

  console.error(
    'Firebase Admin initialization failed:'
  );

  console.error(
    error.message
  );

  process.exit(1);

}


/* =========================================================
   CORS
========================================================= */

app.use(
  cors({

    origin:
      frontendOrigin === '*'
        ? true
        : frontendOrigin,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ],

    credentials: true

  })
);


/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit: '2mb'
  })
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  '/health',
  (_req, res) => {

    res.status(200).json({

      success: true,

      service:
        'AnimeVault API',

      status:
        'healthy',

      timestamp:
        new Date().toISOString()

    });

  }
);


/* =========================================================
   API ROUTES
========================================================= */

app.use(
  '/api',
  router
);


/* =========================================================
   404 HANDLER
========================================================= */

app.use(
  (_req, res) => {

    res.status(404).json({

      success: false,

      error:
        'API endpoint not found.'

    });

  }
);


/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (
    error,
    _req,
    res,
    _next
  ) => {

    console.error(
      'Server error:',
      error
    );


    const statusCode =
      Number(error.statusCode) ||
      Number(error.status) ||
      500;


    res.status(statusCode).json({

      success: false,

      error:
        error.message ||
        'Internal server error.'

    });

  }
);


/* =========================================================
   START SERVER
========================================================= */

const server =
  app.listen(
    port,
    () => {

      console.log(
        '======================================'
      );

      console.log(
        'AnimeVault API Server'
      );

      console.log(
        '======================================'
      );

      console.log(
        `Port: ${port}`
      );

      console.log(
        `Health: http://localhost:${port}/health`
      );

      console.log(
        `API: http://localhost:${port}/api`
      );

      console.log(
        '======================================'
      );

    }
  );


/* =========================================================
   SERVER ERROR
========================================================= */

server.on(
  'error',
  error => {

    console.error(
      'Server startup error:',
      error
    );

    process.exit(1);

  }
);


/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

function shutdown(
  signal
) {

  console.log(
    `${signal} received. Shutting down server...`
  );


  server.close(
    () => {

      console.log(
        'AnimeVault API server stopped.'
      );

      process.exit(0);

    }
  );

}


process.on(
  'SIGINT',
  () => shutdown('SIGINT')
);


process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
);