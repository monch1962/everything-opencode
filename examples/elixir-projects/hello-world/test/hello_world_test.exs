defmodule HelloWorldTest do
  use ExUnit.Case
  doctest HelloWorld

  describe "greet/0" do
    test "returns hello world" do
      assert HelloWorld.greet() == "Hello, World!"
    end
  end

  describe "greet/1" do
    test "greets with name" do
      assert HelloWorld.greet("Alice") == "Hello, Alice!"
    end

    test "greets with empty name" do
      assert HelloWorld.greet("") == "Hello, !"
    end
  end

  describe "add/2" do
    test "adds positive numbers" do
      assert HelloWorld.add(2, 3) == 5
    end

    test "adds negative numbers" do
      assert HelloWorld.add(-1, -2) == -3
    end

    test "adds mixed numbers" do
      assert HelloWorld.add(5, -3) == 2
    end
  end

  describe "even?/1" do
    test "returns true for even numbers" do
      assert HelloWorld.even?(2) == true
      assert HelloWorld.even?(0) == true
      assert HelloWorld.even?(-4) == true
    end

    test "returns false for odd numbers" do
      assert HelloWorld.even?(1) == false
      assert HelloWorld.even?(-3) == false
    end
  end

  describe "fibonacci/1" do
    test "returns empty list for 0" do
      assert HelloWorld.fibonacci(0) == []
    end

    test "returns [0] for 1" do
      assert HelloWorld.fibonacci(1) == [0]
    end

    test "returns first 5 fibonacci numbers" do
      assert HelloWorld.fibonacci(5) == [0, 1, 1, 2, 3]
    end

    test "returns first 10 fibonacci numbers" do
      assert HelloWorld.fibonacci(10) == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
    end
  end
end
