FROM debian:bullseye

RUN apt-get update && apt-get install -y g++

WORKDIR /app

COPY emotion_stability.cpp .

RUN g++ -O3 -fPIC -shared -o libemotion_stability.so emotion_stability.cpp

CMD ["ls", "-lh", "libemotion_stability.so"]
