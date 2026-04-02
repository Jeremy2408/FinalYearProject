# Student Wellbeing Support App

An AI-powered mobile application designed to support college students with stress management, emotional check-ins, burnout awareness, and student-focused wellbeing tools.

This project was developed as a Final Year Project for the BSc (Hons) in Business Computing at Technological University Dublin.

## Overview

This application was created to address the mental health and wellbeing challenges faced by students, especially around academic pressure, deadlines, social stress, and burnout. The system combines mobile development, machine learning, cloud services, and external integrations to provide a more supportive student experience.

Users can log moods, interact with chat features, monitor emotional patterns, receive reminders around deadlines, access wellbeing-oriented tools, and use student-specific support features such as timetable import and library room availability.

## Key Features

### Mood Logging and Emotional Analysis
- Log daily moods and reflections
- Predict emotion categories from text input using a custom TensorFlow model
- Generate a numerical sentiment score for user input
- Track emotional patterns over time

### Emotion Stability Index and Burnout Detection
- Custom Emotion Stability Index (ESI) implemented in C++
- Python wrapper used to integrate the C++ logic into the backend
- Stability score calculated from recent emotional variation and day-to-day change
- Burnout risk classified as Low, Moderate, or High

### Smart Support Features
- AI-powered smart assistant for supportive responses in chatrooms
- Wellness nudges sent to linked group chats when negative emotions are detected
- Deadline reminders posted automatically into relevant chatrooms

### Calendar and Academic Support
- Personal and academic event management
- Drag-to-create calendar events
- Weekly recurring events
- Import timetable data into the in-app calendar
- Link events to module or group chatrooms

### Communication and Productivity Tools
- Group chatrooms and module chatrooms
- Outlook email connection and inbox preview
- OAuth-based Microsoft login flow
- Token refresh support for Outlook integration

### Student Resource Features
- TU Dublin library room availability display
- Direct link to book available library spaces
- Relaxing playlist feature with support for uploaded audio

## Tech Stack

### Frontend
- React Native
- Expo
- Expo Router
- Firebase Authentication
- Firestore
- React Native Paper
- @howljs/calendar-kit

### Backend
- Firebase Cloud Functions
- FastAPI
- Python

### Machine Learning / AI
- TensorFlow / Keras
- Custom tokenizer and trained emotion model
- OpenAI API for numerical sentiment scoring
- C++ shared library for Emotion Stability Index calculations

### External Services / Integrations
- Microsoft Outlook / Microsoft Graph
- Firebase Storage
- Puppeteer
- TU Dublin timetable and library availability sources

## Project Architecture

The system is split across a mobile frontend and multiple backend services:

- **React Native app** for the user interface and feature interaction
- **Firebase** for authentication, Firestore storage, and cloud functions
- **FastAPI backend** for ML inference and support endpoints
- **TensorFlow model** for emotion prediction
- **C++ module** for emotion stability calculations
- **External integrations** for Outlook email, timetable import, and library availability

## Notable Technical Features

### Custom Emotion Prediction
The app uses a trained TensorFlow model to classify text into emotion labels such as joy, sadness, fear, love, surprise, anger, and neutral.

### Hybrid Sentiment Pipeline
A custom emotion classifier is combined with numerical sentiment scoring to provide richer mood analysis.

### Emotion Stability Index
A custom algorithm calculates emotional stability using:
- standard deviation across emotion scores
- average change between consecutive entries

This score is then used to estimate burnout risk.

### Timetable Import
A Firebase Function performs timetable lookup and fetches structured academic events for calendar import.

### Outlook Integration
The system uses Microsoft OAuth and Graph API access to connect a user's Outlook account and display recent inbox messages.

### Library Availability
A Puppeteer-based script scrapes room availability and uploads the results to Firestore for use in the mobile app.

## Example Features in the Repository

Some of the main implemented backend features include:
- `importTimetable` for academic timetable import
- `fetchTimetableByIdentity` for fetching selected timetable data
- `smart-assistant` for AI support replies
- `send-deadline-reminders` for automated reminder messages
- `/predict` for emotion prediction and wellness nudges
- `/stability-index` for burnout-related emotional stability analysis

## Screens / Functional Areas

- Home / dashboard
- Mood logging
- Mood analytics
- Calendar
- Chatrooms
- Email connection
- Library availability
- Relaxing playlist
- Wellness support features

## Why This Project Matters

Unlike generic productivity or mood apps, this project was designed specifically around the student experience. It combines emotional support with academic context by linking together mood history, deadlines, timetables, group chats, and wellbeing tools in one system.

The goal was not just to build a mobile app, but to explore how AI and data-driven analysis can be used to provide more relevant support to students under pressure.

## Challenges Solved

Some of the major technical challenges involved in this project included:
- integrating machine learning into a mobile-focused application
- connecting a C++ algorithm to a Python backend
- managing real-time cloud data with Firebase
- handling OAuth and token lifecycle for Outlook integration
- importing and structuring timetable data
- scraping and presenting live availability data
- coordinating multiple interconnected features without reducing usability

## Future Improvements

Possible future enhancements include:
- improved personalization of recommendations
- stronger mental-health-specific intervention flows
- broader analytics and trend visualization
- better support for multiple universities
- expansion of the recommendation engine
- richer peer support and moderation features
- improved UI polish and consistency across all screens

