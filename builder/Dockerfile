FROM ubuntu:22.04

RUN apt-get update && apt-get install -y g++

COPY emotion_stability.cpp .

RUN g++ -fPIC -shared -o libemotion_stability.so emotion_stability.cpp

CMD ["ls", "-lh", "libemotion_stability.so"]
