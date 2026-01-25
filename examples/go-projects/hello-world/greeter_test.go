package main

import (
	"fmt"
	"testing"
)

func TestNewGreeter(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"Empty name", "", ""},
		{"Simple name", "Alice", "Alice"},
		{"Name with spaces", "John Doe", "John Doe"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			greeter := NewGreeter(tt.input)
			if greeter.Name != tt.expected {
				t.Errorf("NewGreeter(%q).Name = %q, want %q", tt.input, greeter.Name, tt.expected)
			}
		})
	}
}

func TestGreeter_Greet(t *testing.T) {
	tests := []struct {
		name     string
		greeter  *Greeter
		expected string
	}{
		{"Empty name", NewGreeter(""), "Hello, World!"},
		{"Simple name", NewGreeter("Alice"), "Hello, Alice!"},
		{"Special characters", NewGreeter("世界"), "Hello, 世界!"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.greeter.Greet()
			if got != tt.expected {
				t.Errorf("Greeter.Greet() = %q, want %q", got, tt.expected)
			}
		})
	}
}

func TestGreeter_GreetLoudly(t *testing.T) {
	tests := []struct {
		name     string
		greeter  *Greeter
		expected string
	}{
		{"Empty name", NewGreeter(""), "HELLO, WORLD!"},
		{"Simple name", NewGreeter("Bob"), "HELLO, BOB!"},
		{"Mixed case", NewGreeter("MiXeDcAsE"), "HELLO, MIXEDCASE!"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.greeter.GreetLoudly()
			if got != tt.expected {
				t.Errorf("Greeter.GreetLoudly() = %q, want %q", got, tt.expected)
			}
		})
	}
}

func BenchmarkGreeter_Greet(b *testing.B) {
	greeter := NewGreeter("Benchmark")
	for i := 0; i < b.N; i++ {
		greeter.Greet()
	}
}

func BenchmarkGreeter_GreetLoudly(b *testing.B) {
	greeter := NewGreeter("Benchmark")
	for i := 0; i < b.N; i++ {
		greeter.GreetLoudly()
	}
}

func ExampleGreeter_Greet() {
	greeter := NewGreeter("Example")
	fmt.Println(greeter.Greet())
	// Output: Hello, Example!
}

func ExampleGreeter_GreetLoudly() {
	greeter := NewGreeter("Example")
	fmt.Println(greeter.GreetLoudly())
	// Output: HELLO, EXAMPLE!
}
