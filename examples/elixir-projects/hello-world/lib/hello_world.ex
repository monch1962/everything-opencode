defmodule HelloWorld do
  @moduledoc """
  HelloWorld module provides greeting functions.
  """

  @doc """
  Returns a greeting message.

  ## Examples

      iex> HelloWorld.greet()
      "Hello, World!"

      iex> HelloWorld.greet("Alice")
      "Hello, Alice!"
  """
  @spec greet() :: String.t()
  def greet do
    "Hello, World!"
  end

  @spec greet(String.t()) :: String.t()
  def greet(name) when is_binary(name) do
    "Hello, #{name}!"
  end

  @doc """
  Calculates the sum of two numbers.

  ## Examples

      iex> HelloWorld.add(2, 3)
      5

      iex> HelloWorld.add(-1, 1)
      0
  """
  @spec add(integer(), integer()) :: integer()
  def add(a, b) when is_integer(a) and is_integer(b) do
    a + b
  end

  @doc """
  Checks if a number is even.

  ## Examples

      iex> HelloWorld.even?(2)
      true

      iex> HelloWorld.even?(3)
      false
  """
  @spec even?(integer()) :: boolean()
  def even?(n) when is_integer(n) do
    rem(n, 2) == 0
  end

  @doc """
  Returns a list of Fibonacci numbers up to the given count.

  ## Examples

      iex> HelloWorld.fibonacci(5)
      [0, 1, 1, 2, 3]

      iex> HelloWorld.fibonacci(1)
      [0]
  """
  @spec fibonacci(non_neg_integer()) :: list(non_neg_integer())
  def fibonacci(0), do: []
  def fibonacci(1), do: [0]

  def fibonacci(n) when is_integer(n) and n > 1 do
    Stream.unfold({0, 1}, fn {a, b} -> {a, {b, a + b}} end)
    |> Enum.take(n)
  end
end
