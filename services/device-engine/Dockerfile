FROM gcc:14-bookworm AS builder
WORKDIR /src
RUN apt-get update && apt-get install -y --no-install-recommends cmake && rm -rf /var/lib/apt/lists/*
COPY . .
RUN cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF && cmake --build build --parallel

FROM debian:bookworm-slim
RUN useradd --system --uid 10001 axiom
COPY --from=builder /src/build/axiom-device-engine /usr/local/bin/axiom-device-engine
USER axiom
EXPOSE 9300
ENTRYPOINT ["/usr/local/bin/axiom-device-engine"]
