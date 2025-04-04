FROM gcc:12 AS builder

WORKDIR /app

COPY emotion_stability.cpp .

RUN g++ -Wall -O3 -fPIC -shared -o libemotion_stability.so emotion_stability.cpp
