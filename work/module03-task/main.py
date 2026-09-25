"""Entry point that demonstrates the calculator functions."""

from calculator import add, subtract


def main():
    a, b = 10, 4
    print(f"{a} + {b} = {add(a, b)}")
    print(f"{a} - {b} = {subtract(a, b)}")


if __name__ == "__main__":
    main()
