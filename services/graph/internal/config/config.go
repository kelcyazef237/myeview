package config

import (
	"github.com/spf13/viper"
)

type Config struct {
	Port       string
	NatsURL    string
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
}

func LoadConfig() *Config {
	viper.SetDefault("PORT", "8085")
	viper.SetDefault("NATS_URL", "nats://nats:4222")
	viper.SetDefault("DB_HOST", "localhost")
	viper.SetDefault("DB_PORT", "5432")
	viper.SetDefault("DB_USER", "myeview")
	viper.SetDefault("DB_PASSWORD", "myeview_password")
	viper.SetDefault("DB_NAME", "myeview")
	viper.SetDefault("DB_SSL_MODE", "disable")

	viper.AutomaticEnv()

	return &Config{
		Port:       viper.GetString("PORT"),
		NatsURL:    viper.GetString("NATS_URL"),
		DBHost:     viper.GetString("DB_HOST"),
		DBPort:     viper.GetString("DB_PORT"),
		DBUser:     viper.GetString("DB_USER"),
		DBPassword: viper.GetString("DB_PASSWORD"),
		DBName:     viper.GetString("DB_NAME"),
		DBSSLMode:  viper.GetString("DB_SSL_MODE"),
	}
}
