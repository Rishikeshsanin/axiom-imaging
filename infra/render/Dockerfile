FROM gcc:14-bookworm AS device-builder
WORKDIR /src
RUN apt-get update \
    && apt-get install -y --no-install-recommends cmake \
    && rm -rf /var/lib/apt/lists/*
COPY services/device-engine ./services/device-engine
RUN cmake -S services/device-engine -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF \
    && cmake --build build --parallel

FROM orthancteam/orthanc:26.8.2

USER root
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3-venv nginx ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/axiom
COPY apps/api ./api
RUN python3 -m venv /opt/axiom/venv \
    && /opt/axiom/venv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/axiom/venv/bin/pip install --no-cache-dir ./api

COPY --from=device-builder /src/build/axiom-device-engine /usr/local/bin/axiom-device-engine
COPY infra/render/nginx.conf /opt/axiom/nginx.conf
COPY infra/render/start.sh /opt/axiom/start.sh
RUN chmod +x /opt/axiom/start.sh \
    && mkdir -p /var/lib/orthanc/db /var/log/nginx /var/lib/nginx /run/nginx

ENTRYPOINT []
CMD ["/opt/axiom/start.sh"]
