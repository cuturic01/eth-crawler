package storage

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type Cache struct {
	rdb *redis.Client
}

func InitCache(url string) *Cache {
	opt, err := redis.ParseURL(url)
	if err != nil {
		return nil
	}
	return &Cache{rdb: redis.NewClient(opt)}
}

func (c *Cache) Get(ctx context.Context, key string) (string, bool, error) {
	val, err := c.rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", false, nil
	}
	if err != nil {
		return "", false, err
	}
	return val, true, nil
}

func (c *Cache) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	return c.rdb.Set(ctx, key, value, ttl).Err()
}