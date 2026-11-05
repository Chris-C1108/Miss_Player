FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata
WORKDIR /app
COPY miss-resolver /app/miss-resolver
ENV PORT=8765
ENV PROXY_URL=http://192.168.2.250:7890
EXPOSE 8765
CMD ["/app/miss-resolver"]
