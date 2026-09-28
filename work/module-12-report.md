# Module 12 Completion Report

## Instruction File
- Filename: instructions/use-benchASMT.agent.md

```markdown
---
name: use-benchASMT
description: Identify bench associates for a skill from the A1 repo and generate a LeetCode-style Java skill review assessment with tools/Java_bench_ASMT.py.
tools: ["execute"]
---

# Java Bench Skill Assessment

## When to Use

Use this instruction when the user asks to:

- Generate a Java skill review test / coding assessment for bench associates
- Identify bench associates for a skill and create practice problems for them
- Produce a LeetCode-style test from the A1 repo data

Always use the existing tools — do **not** reimplement filtering or problem generation inline:

- `tools/export_bench_associates.py` — extracts associates from the A1 repo workbook (the consistent source)
- `tools/Java_bench_ASMT.py` — generates the assessment from the exported CSV

Do NOT use for non-Java assessments, interview scheduling, or performance reviews (the problem bank is Java-focused).

## Source of Truth

The A1 repo workbook is the single consistent source for associates of **any** skill:

`C:\Users\KrishnachandYamarthi\OneDrive - EPAM\Krishna\2026\India - JAP\JAP Champions\JAP Dashboard\A1 Repo Data 25092026.xlsx` (worksheet: `Working Sheet`)

It is the default `--repo` in `export_bench_associates.py`; only pass `--repo` when the user provides a refreshed/newer dated file.

## How to Invoke

Run from the workspace root, in two steps.

### Step 1 — Export bench associates for the skill

```
python tools/export_bench_associates.py --skill Java --count 5 --output tools/bench_java_5.csv
```

| Option | Meaning | Default |
|---|---|---|
| `--skill` | Primary Skill to match (exact, case-insensitive) | *(required)* |
| `--contains` | Substring skill match instead of exact | off |
| `--count` | Limit to first N matches | all |
| `--no-bench-only` | Include non-bench associates too | bench only |
| `--output` | Output CSV path | `bench_associates.csv` |
| `--list-skills` | List available skills with bench counts, then exit | — |

If the user names a skill loosely (e.g. "Java testing"), run `--list-skills` first and confirm the exact Primary Skill value (e.g. "Automated Testing in Java" vs "Java").

### Step 2 — Generate the assessment

```
python tools/Java_bench_ASMT.py --associates tools/bench_java_5.csv --problems 5 --difficulty mixed --seed 42 --output tools/java_bench_assessment.md
```

| Option | Meaning | Default |
|---|---|---|
| `--associates` | CSV from step 1 (needs `name`, `status` columns) | *(required)* |
| `--bench-status` | Status value marking bench | `Bench` |
| `--problems` | Number of problems (bank has 8: 3 Easy / 3 Medium / 2 Hard) | 5 |
| `--difficulty` | `easy`, `medium`, `hard`, or `mixed` | `mixed` |
| `--seed` | Random seed for reproducible selection | random |
| `--output` | Output Markdown file | `java_bench_assessment.md` |

Guidelines:

- Use `--seed 42` for a balanced difficulty spread (3 Easy / 1 Medium / 1 Hard at 5 problems) unless the user wants a different draw; always record the seed used so the test can be reproduced.
- If the user asks for a specific difficulty, pass it through with `--difficulty`.
- The exported CSV already has `status = "Bench"` rows, so `--bench-status` rarely needs changing.

## How to Present Results

1. State the source file and worksheet, skill, and bench filter used.
2. Show the identified associates as a table: Name, Email, City, Unit, Bench Ageing.
3. List the selected problems as `Title (Difficulty)`.
4. Link the generated assessment Markdown and CSV files.
5. Mention the total pool size (e.g. "176 Java associates on bench") so the user knows the sample scope.

## Reference Run

```
> python tools/export_bench_associates.py --skill Java --count 5 --output tools/bench_java_5.csv
Exported 5 'Java' associates -> tools/bench_java_5.csv

> python tools/Java_bench_ASMT.py --associates tools/bench_java_5.csv --problems 5 --seed 42 --output tools/java_bench_assessment.md
Bench associates identified: 5
Problems selected (mixed): 5
Assessment written to: tools/java_bench_assessment.md
```
```

## Script File
- Filename: tools/Java_bench_ASMT.py
- Language: Python

```python
"""Identify bench associates and generate a LeetCode-style Java skill review test.

Usage:
    python tools/Java_bench_ASMT.py --associates associates.csv
    python tools/Java_bench_ASMT.py --associates associates.csv --problems 5 \
        --difficulty mixed --seed 42 --output java_bench_assessment.md

The associates CSV must have at least `name` and `status` columns
(case-insensitive); an `email` column is optional. Associates whose status
matches --bench-status (default: "Bench") are selected as test takers.
"""

import argparse
import csv
import random
import sys
from pathlib import Path

PROBLEM_BANK = [
    {
        "title": "Two Sum",
        "difficulty": "Easy",
        "description": (
            "Given an array of integers `nums` and an integer `target`, return the "
            "indices of the two numbers that add up to `target`. Exactly one solution "
            "exists and the same element may not be used twice."
        ),
        "examples": ["nums = [2,7,11,15], target = 9 -> [0,1]", "nums = [3,2,4], target = 6 -> [1,2]"],
        "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i], target <= 10^9"],
        "starter": "public int[] twoSum(int[] nums, int target) {\n    \n}",
        "tests": ["twoSum([2,7,11,15], 9) == [0,1]", "twoSum([3,3], 6) == [0,1]"],
    },
    {
        "title": "Valid Palindrome",
        "difficulty": "Easy",
        "description": (
            "A phrase is a palindrome if, after converting all uppercase letters to "
            "lowercase and removing all non-alphanumeric characters, it reads the same "
            "forward and backward. Return `true` if the given string is a palindrome."
        ),
        "examples": ['"A man, a plan, a canal: Panama" -> true', '"race a car" -> false'],
        "constraints": ["1 <= s.length <= 2 * 10^5"],
        "starter": "public boolean isPalindrome(String s) {\n    \n}",
        "tests": ['isPalindrome("A man, a plan, a canal: Panama") == true', 'isPalindrome("0P") == false'],
    },
    {
        "title": "Best Time to Buy and Sell Stock",
        "difficulty": "Easy",
        "description": (
            "Given an array `prices` where `prices[i]` is the stock price on day i, "
            "return the maximum profit from one buy followed by one sell on a later "
            "day. Return 0 if no profit is possible."
        ),
        "examples": ["prices = [7,1,5,3,6,4] -> 5", "prices = [7,6,4,3,1] -> 0"],
        "constraints": ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
        "starter": "public int maxProfit(int[] prices) {\n    \n}",
        "tests": ["maxProfit([7,1,5,3,6,4]) == 5", "maxProfit([7,6,4,3,1]) == 0"],
    },
    {
        "title": "Longest Substring Without Repeating Characters",
        "difficulty": "Medium",
        "description": (
            "Given a string `s`, find the length of the longest substring without "
            "duplicate characters."
        ),
        "examples": ['"abcabcbb" -> 3 ("abc")', '"bbbbb" -> 1', '"pwwkew" -> 3 ("wke")'],
        "constraints": ["0 <= s.length <= 5 * 10^4"],
        "starter": "public int lengthOfLongestSubstring(String s) {\n    \n}",
        "tests": ['lengthOfLongestSubstring("abcabcbb") == 3', 'lengthOfLongestSubstring("pwwkew") == 3'],
    },
    {
        "title": "Product of Array Except Self",
        "difficulty": "Medium",
        "description": (
            "Given an integer array `nums`, return an array `answer` where `answer[i]` "
            "is the product of all elements of `nums` except `nums[i]`. Solve it in "
            "O(n) time without using division."
        ),
        "examples": ["nums = [1,2,3,4] -> [24,12,8,6]", "nums = [-1,1,0,-3,3] -> [0,0,9,0,0]"],
        "constraints": ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30"],
        "starter": "public int[] productExceptSelf(int[] nums) {\n    \n}",
        "tests": ["productExceptSelf([1,2,3,4]) == [24,12,8,6]", "productExceptSelf([-1,1,0,-3,3]) == [0,0,9,0,0]"],
    },
    {
        "title": "Merge Intervals",
        "difficulty": "Medium",
        "description": (
            "Given an array of `intervals` where `intervals[i] = [start, end]`, merge "
            "all overlapping intervals and return an array of the non-overlapping "
            "intervals that cover all the intervals in the input."
        ),
        "examples": ["[[1,3],[2,6],[8,10],[15,18]] -> [[1,6],[8,10],[15,18]]", "[[1,4],[4,5]] -> [[1,5]]"],
        "constraints": ["1 <= intervals.length <= 10^4", "start <= end"],
        "starter": "public int[][] merge(int[][] intervals) {\n    \n}",
        "tests": ["merge([[1,3],[2,6],[8,10],[15,18]]) == [[1,6],[8,10],[15,18]]"],
    },
    {
        "title": "Trapping Rain Water",
        "difficulty": "Hard",
        "description": (
            "Given `n` non-negative integers representing an elevation map where the "
            "width of each bar is 1, compute how much water it can trap after raining."
        ),
        "examples": ["height = [0,1,0,2,1,0,1,3,2,1,2,1] -> 6", "height = [4,2,0,3,2,5] -> 9"],
        "constraints": ["1 <= height.length <= 2 * 10^4", "0 <= height[i] <= 10^5"],
        "starter": "public int trap(int[] height) {\n    \n}",
        "tests": ["trap([0,1,0,2,1,0,1,3,2,1,2,1]) == 6", "trap([4,2,0,3,2,5]) == 9"],
    },
    {
        "title": "Median of Two Sorted Arrays",
        "difficulty": "Hard",
        "description": (
            "Given two sorted arrays `nums1` and `nums2` of sizes m and n, return the "
            "median of the two sorted arrays. The overall run time complexity must be "
            "O(log(m+n))."
        ),
        "examples": ["nums1 = [1,3], nums2 = [2] -> 2.0", "nums1 = [1,2], nums2 = [3,4] -> 2.5"],
        "constraints": ["0 <= m, n <= 1000", "-10^6 <= nums1[i], nums2[i] <= 10^6"],
        "starter": "public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n    \n}",
        "tests": ["findMedianSortedArrays([1,3], [2]) == 2.0", "findMedianSortedArrays([1,2], [3,4]) == 2.5"],
    },
]


def load_bench_associates(csv_path: Path, bench_status: str) -> list[dict]:
    """Return associates from the CSV whose status matches bench_status."""
    if not csv_path.is_file():
        sys.exit(f"Error: associates file not found: {csv_path}")
    with csv_path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            sys.exit(f"Error: {csv_path} has no header row")
        columns = {c.strip().lower(): c for c in reader.fieldnames}
        if "name" not in columns or "status" not in columns:
            sys.exit(f"Error: CSV must contain 'name' and 'status' columns, got: {reader.fieldnames}")
        bench = [
            {
                "name": row[columns["name"]].strip(),
                "email": (row.get(columns.get("email", ""), "") or "").strip(),
            }
            for row in reader
            if (row.get(columns["status"], "") or "").strip().lower() == bench_status.lower()
        ]
    return bench


def select_problems(count: int, difficulty: str, seed: int | None) -> list[dict]:
    pool = PROBLEM_BANK if difficulty == "mixed" else [
        p for p in PROBLEM_BANK if p["difficulty"].lower() == difficulty
    ]
    if not pool:
        sys.exit(f"Error: no problems available for difficulty '{difficulty}'")
    if count > len(pool):
        print(f"Warning: only {len(pool)} problems available for '{difficulty}'; using all of them.")
        count = len(pool)
    rng = random.Random(seed)
    return sorted(rng.sample(pool, count), key=lambda p: ("Easy", "Medium", "Hard").index(p["difficulty"]))


def render_assessment(associates: list[dict], problems: list[dict]) -> str:
    lines = ["# Java Skill Review Assessment", ""]
    lines.append(f"## Bench Associates ({len(associates)})")
    if associates:
        for a in associates:
            email = f" <{a['email']}>" if a["email"] else ""
            lines.append(f"- {a['name']}{email}")
    else:
        lines.append("- _No bench associates identified — check the input CSV._")
    lines.append("")
    lines.append(f"## Problems ({len(problems)})")
    lines.append("Solve each problem in the `Solution` class. Aim for optimal time and space complexity.")
    for i, p in enumerate(problems, 1):
        lines += [
            "",
            f"### {i}. {p['title']} ({p['difficulty']})",
            "",
            p["description"],
            "",
            "**Examples**",
            *[f"- `{e}`" for e in p["examples"]],
            "",
            "**Constraints**",
            *[f"- {c}" for c in p["constraints"]],
            "",
            "**Starter code**",
            "```java",
            "class Solution {",
            *[f"    {line}" for line in p["starter"].splitlines()],
            "}",
            "```",
            "",
            "**Test cases your solution must pass**",
            *[f"- `{t}`" for t in p["tests"]],
        ]
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Identify bench associates and generate a LeetCode-style Java skill review test."
    )
    parser.add_argument("--associates", required=True, type=Path,
                        help="CSV file with 'name' and 'status' columns (optional 'email')")
    parser.add_argument("--bench-status", default="Bench",
                        help="Status value identifying bench associates (default: Bench)")
    parser.add_argument("--problems", type=int, default=5,
                        help="Number of problems in the test (default: 5)")
    parser.add_argument("--difficulty", choices=["easy", "medium", "hard", "mixed"], default="mixed",
                        help="Problem difficulty filter (default: mixed)")
    parser.add_argument("--seed", type=int, default=None,
                        help="Random seed for reproducible problem selection")
    parser.add_argument("--output", type=Path, default=Path("java_bench_assessment.md"),
                        help="Output Markdown file (default: java_bench_assessment.md)")
    args = parser.parse_args()

    if args.problems < 1:
        sys.exit("Error: --problems must be >= 1")

    bench = load_bench_associates(args.associates, args.bench_status)
    problems = select_problems(args.problems, args.difficulty, args.seed)

    args.output.write_text(render_assessment(bench, problems), encoding="utf-8")

    print(f"Bench associates identified: {len(bench)}")
    for a in bench:
        print(f"  - {a['name']}" + (f" <{a['email']}>" if a["email"] else ""))
    print(f"Problems selected ({args.difficulty}): {len(problems)}")
    for p in problems:
        print(f"  - [{p['difficulty']}] {p['title']}")
    print(f"Assessment written to: {args.output}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## Script Execution Output

```
PS C:\Users\KrishnachandYamarthi\OneDrive - EPAM\GHC_Workspace> python tools\Java_bench_ASMT.py --help
usage: Java_bench_ASMT.py [-h] --associates ASSOCIATES
                          [--bench-status BENCH_STATUS] [--problems PROBLEMS]
                          [--difficulty {easy,medium,hard,mixed}]
                          [--seed SEED] [--output OUTPUT]

Identify bench associates and generate a LeetCode-style Java skill review
test.

options:
  -h, --help            show this help message and exit
  --associates ASSOCIATES
                        CSV file with 'name' and 'status' columns (optional
                        'email')
  --bench-status BENCH_STATUS
                        Status value identifying bench associates (default:
                        Bench)
  --problems PROBLEMS   Number of problems in the test (default: 5)
  --difficulty {easy,medium,hard,mixed}
                        Problem difficulty filter (default: mixed)
  --seed SEED           Random seed for reproducible problem selection
  --output OUTPUT       Output Markdown file (default:
                        java_bench_assessment.md)
```

Test invocation (end-to-end run against the A1 repo export):

```
PS C:\Users\KrishnachandYamarthi\OneDrive - EPAM\GHC_Workspace> python tools\Java_bench_ASMT.py --associates tools\bench_java_5.csv --problems 5 --difficulty mixed --seed 42 --output tools\java_bench_assessment.md
Bench associates identified: 5
  - Abhay Kumar Sharma <abhay_kumarsharma@epam.com>
  - Abhinav Kumar5 <abhinav_kumar5@epam.com>
  - Abhishek Kumar22 <abhishek_kumar22@epam.com>
  - Abhishek N m <abhishek_nm@epam.com>
  - Aditya Hiremath <aditya_hiremath@epam.com>
Problems selected (mixed): 5
  - [Easy] Valid Palindrome
  - [Easy] Two Sum
  - [Easy] Best Time to Buy and Sell Stock
  - [Medium] Merge Intervals
  - [Hard] Median of Two Sorted Arrays
Assessment written to: C:\Users\KrishnachandYamarthi\OneDrive - EPAM\GHC_Workspace\tools\java_bench_assessment.md
```
