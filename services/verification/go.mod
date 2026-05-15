module github.com/myeview/myeview/services/verification

go 1.26.2

require (
	github.com/myeview/myeview/libs/events v0.0.0-00010101000000-000000000000
	github.com/spf13/viper v1.18.2
)

replace github.com/myeview/myeview/libs/events => ../../libs/events
