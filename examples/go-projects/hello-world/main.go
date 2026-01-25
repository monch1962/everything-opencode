package main

import (
	"fmt"
	"os"
	"strings"
)

// Greeter provides greeting functionality
type Greeter struct {
	Name string
}

// NewGreeter creates a new Greeter instance
func NewGreeter(name string) *Greeter {
	return &Greeter{Name: name}
}

// Greet returns a greeting message
func (g *Greeter) Greet() string {
	if g.Name == "" {
		return "Hello, World!"
	}
	return fmt.Sprintf("Hello, %s!", g.Name)
}

// GreetLoudly returns a greeting in uppercase
func (g *Greeter) GreetLoudly() string {
	return strings.ToUpper(g.Greet())
}

func main() {
	// Get name from command line arguments or use default
	name := "World"
	if len(os.Args) > 1 {
		name = os.Args[1]
	}

	// Create greeter and get greeting
	greeter := NewGreeter(name)
	greeting := greeter.Greet()

	// Print greeting
	fmt.Println(greeting)

	// Also print loud version
	if len(os.Args) > 2 && os.Args[2] == "--loud" {
		fmt.Println(greeter.GreetLoudly())
	}
}
