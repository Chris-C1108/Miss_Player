# Stage 1: 编译静态 Linux AMD64 二进制
FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /out/miss-gateway .

# Stage 2: 极轻量运行时镜像 (< 20MB)
FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY --from=builder /out/miss-gateway /app/miss-gateway
# 建立向后兼容软链接，平滑接替旧容器
RUN ln -s /app/miss-gateway /app/miss-resolver
ENV PORT=8765
ENV PROXY_URL=http://192.168.2.250:7890
EXPOSE 8765
CMD ["/app/miss-gateway"]
