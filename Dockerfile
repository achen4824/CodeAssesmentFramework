FROM ubuntu
# ...
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get -y install gcc mono-mcs openjdk-8-jre python3 && rm -rf /var/lib/apt/lists/*
#COPY script.sh /script.sh
#COPY GvGPe6.exe /GvGPe6.exe
#CMD ["/script.sh"]
