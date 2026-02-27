/**
 * @fileoverview Application-wide constants for the Auto Suggestion Quiz app.
 * Includes UI config, problem data, and AI suggestion sets.
 * @module constants
 */

/**
 * Maps difficulty levels to their display colors.
 * @constant {Object.<string, string>}
 * @property {string} Easy - Green color for easy problems.
 * @property {string} Medium - Amber color for medium problems.
 * @property {string} Hard - Red color for hard problems.
 */
export const DIFFICULTY_COLORS = {
  Easy: '#16825d',
  Medium: '#c08b30',
  Hard: '#e05555',
};
/**
 * Display configuration for each problem status.
 * @constant {Object.<string, {label: string, color: string, icon: string}>}
 */
export const STATUS_CONFIG = {
  completed: { label: 'Completed', color: '#16825d', icon: '✓' },
  'in-progress': { label: 'In Progress', color: '#569cd6', icon: '◐' },
  'not-started': { label: 'Not Started', color: '#666', icon: '○' },
};
/**
 * Maps app language keys to Monaco editor language identifiers.
 * @constant {Object.<string, string>}
 */
export const LANGUAGE_MAP = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  c: 'c',
};
/**
 * List of coding problems available in the app.
 * @constant {Object[]}
 * @property {number} id - Unique problem ID.
 * @property {string} title - Problem title.
 * @property {string} difficulty - 'Easy', 'Medium', or 'Hard'.
 * @property {string[]} tags - Topic tags.
 * @property {string} status - 'not-started', 'in-progress', or 'completed'.
 * @property {string|null} grade - Grade percentage if completed, otherwise null.
 * @property {string} description - Full problem description.
 * @property {Object[]} examples - Example input/output pairs.
 * @property {Object} starterCode - Starter code keyed by language.
 */
export const PROBLEMS = [
  {
    id: 1,
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Arrays', 'Hash Table'],
    status: 'completed',
    grade: '95',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: '' },
    ],
    starterCode: {
      python: 'def two_sum(nums, target):\n    # Write your solution here\n    pass\n',
      javascript: 'function twoSum(nums, target) {\n    // Write your solution here\n\n}\n',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}\n',
      c: '#include <stdlib.h>\n\nint* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}\n',
    },
  },
  {
    id: 2,
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['Strings', 'Stack'],
    status: 'in-progress',
    grade: null,
    description:
      'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    examples: [
      { input: 's = "()"', output: 'true', explanation: '' },
      { input: 's = "()[]{}"', output: 'true', explanation: '' },
      { input: 's = "(]"', output: 'false', explanation: '' },
    ],
    starterCode: {
      python: 'def is_valid(s):\n    # Write your solution here\n    pass\n',
      javascript: 'function isValid(s) {\n    // Write your solution here\n\n}\n',
      java: 'class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        return false;\n    }\n}\n',
      c: '#include <stdbool.h>\n\nbool isValid(char* s) {\n    // Write your solution here\n    return false;\n}\n',
    },
  },
  {
    id: 3,
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    status: 'not-started',
    grade: null,
    description:
      'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: '' },
      { input: 'head = [1,2]', output: '[2,1]', explanation: '' },
    ],
    starterCode: {
      python: 'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef reverse_list(head):\n    # Write your solution here\n    pass\n',
      javascript: 'function reverseList(head) {\n    // Write your solution here\n\n}\n',
      java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your solution here\n        return null;\n    }\n}\n',
      c: 'struct ListNode* reverseList(struct ListNode* head) {\n    // Write your solution here\n    return NULL;\n}\n',
    },
  },
  {
    id: 4,
    title: 'Binary Search',
    difficulty: 'Easy',
    tags: ['Arrays', 'Binary Search'],
    status: 'not-started',
    grade: null,
    description:
      'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists in nums and its index is 4.' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums so return -1.' },
    ],
    starterCode: {
      python: 'def search(nums, target):\n    # Write your solution here\n    pass\n',
      javascript: 'function search(nums, target) {\n    // Write your solution here\n\n}\n',
      java: 'class Solution {\n    public int search(int[] nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n}\n',
      c: 'int search(int* nums, int numsSize, int target) {\n    // Write your solution here\n    return -1;\n}\n',
    },
  },
  {
    id: 5,
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    status: 'completed',
    grade: '88',
    description:
      'You are given the heads of two sorted linked lists list1 and list2.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.',
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]', explanation: '' },
      { input: 'list1 = [], list2 = []', output: '[]', explanation: '' },
    ],
    starterCode: {
      python: 'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef merge_two_lists(list1, list2):\n    # Write your solution here\n    pass\n',
      javascript: 'function mergeTwoLists(list1, list2) {\n    // Write your solution here\n\n}\n',
      java: 'class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Write your solution here\n        return null;\n    }\n}\n',
      c: 'struct ListNode* mergeTwoLists(struct ListNode* list1, struct ListNode* list2) {\n    // Write your solution here\n    return NULL;\n}\n',
    },
  },
  {
    id: 6,
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    tags: ['Arrays', 'Dynamic Programming'],
    status: 'not-started',
    grade: null,
    description:
      'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1', explanation: '' },
    ],
    starterCode: {
      python: 'def max_sub_array(nums):\n    # Write your solution here\n    pass\n',
      javascript: 'function maxSubArray(nums) {\n    // Write your solution here\n\n}\n',
      java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}\n',
      c: 'int maxSubArray(int* nums, int numsSize) {\n    // Write your solution here\n    return 0;\n}\n',
    },
  },
  {
    id: 7,
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    tags: ['Dynamic Programming', 'Math'],
    status: 'in-progress',
    grade: null,
    description:
      'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    examples: [
      { input: 'n = 2', output: '2', explanation: 'There are two ways: 1+1 and 2.' },
      { input: 'n = 3', output: '3', explanation: 'There are three ways: 1+1+1, 1+2, and 2+1.' },
    ],
    starterCode: {
      python: 'def climb_stairs(n):\n    # Write your solution here\n    pass\n',
      javascript: 'function climbStairs(n) {\n    // Write your solution here\n\n}\n',
      java: 'class Solution {\n    public int climbStairs(int n) {\n        // Write your solution here\n        return 0;\n    }\n}\n',
      c: 'int climbStairs(int n) {\n    // Write your solution here\n    return 0;\n}\n',
    },
  },
  {
    id: 8,
    title: 'Container With Most Water',
    difficulty: 'Medium',
    tags: ['Arrays', 'Two Pointers'],
    status: 'not-started',
    grade: null,
    description:
      'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.',
    examples: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: '' },
      { input: 'height = [1,1]', output: '1', explanation: '' },
    ],
    starterCode: {
      python: 'def max_area(height):\n    # Write your solution here\n    pass\n',
      javascript: 'function maxArea(height) {\n    // Write your solution here\n\n}\n',
      java: 'class Solution {\n    public int maxArea(int[] height) {\n        // Write your solution here\n        return 0;\n    }\n}\n',
      c: 'int maxArea(int* height, int heightSize) {\n    // Write your solution here\n    return 0;\n}\n',
    },
  },
  {
    id: 9,
    title: '3Sum',
    difficulty: 'Medium',
    tags: ['Arrays', 'Two Pointers', 'Sorting'],
    status: 'not-started',
    grade: null,
    description:
      'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nNotice that the solution set must not contain duplicate triplets.',
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]', explanation: '' },
      { input: 'nums = [0,1,1]', output: '[]', explanation: '' },
    ],
    starterCode: {
      python: 'def three_sum(nums):\n    # Write your solution here\n    pass\n',
      javascript: 'function threeSum(nums) {\n    // Write your solution here\n\n}\n',
      java: 'class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}\n',
      c: 'int** threeSum(int* nums, int numsSize, int* returnSize, int** returnColumnSizes) {\n    // Write your solution here\n    *returnSize = 0;\n    return NULL;\n}\n',
    },
  },
];
/**
 * AI autocomplete suggestions indexed by problem ID.
 * Each entry is an array of suggestion objects for the Monaco completion provider.
 * @constant {Object.<number, Object[]>}
 * @property {string} suggestions[].label - Display label for the suggestion.
 * @property {string} suggestions[].detail - Short detail string shown in the dropdown.
 * @property {string} suggestions[].insertText - Code snippet to insert.
 */
export const AI_SUGGESTIONS_BY_PROBLEM = {
  1: [
    {
      label: 'Use a hash map for O(n) lookup',
      detail: 'AI Suggestion',
      insertText: 'seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i',
    },
    {
      label: 'Brute force with nested loops',
      detail: 'AI Suggestion',
      insertText: 'for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]',
    },
    {
      label: 'Sort and use two pointers',
      detail: 'AI Suggestion',
      insertText: 'indexed = sorted(enumerate(nums), key=lambda x: x[1])\n    left, right = 0, len(indexed) - 1\n    while left < right:\n        total = indexed[left][1] + indexed[right][1]\n        if total == target:\n            return [indexed[left][0], indexed[right][0]]\n        elif total < target:\n            left += 1\n        else:\n            right -= 1',
    },
  ],
  2: [
    {
      label: 'Stack-based matching',
      detail: 'AI Suggestion',
      insertText: 'stack = []\n    mapping = {")": "(", "}": "{", "]": "["}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else "#"\n            if mapping[char] != top:\n                return False\n        else:\n            stack.append(char)\n    return not stack',
    },
    {
      label: 'Replace pairs iteratively',
      detail: 'AI Suggestion',
      insertText: 'while "()" in s or "{}" in s or "[]" in s:\n        s = s.replace("()", "").replace("{}", "").replace("[]", "")\n    return s == ""',
    },
  ],
  3: [
    {
      label: 'Iterative pointer reversal',
      detail: 'AI Suggestion',
      insertText: 'prev = None\n    current = head\n    while current:\n        next_node = current.next\n        current.next = prev\n        prev = current\n        current = next_node\n    return prev',
    },
    {
      label: 'Recursive approach',
      detail: 'AI Suggestion',
      insertText: 'if not head or not head.next:\n        return head\n    new_head = reverse_list(head.next)\n    head.next.next = head\n    head.next = None\n    return new_head',
    },
  ],
  4: [
    {
      label: 'Classic binary search loop',
      detail: 'AI Suggestion',
      insertText: 'left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1',
    },
    {
      label: 'Recursive binary search',
      detail: 'AI Suggestion',
      insertText: 'def helper(left, right):\n        if left > right:\n            return -1\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            return helper(mid + 1, right)\n        else:\n            return helper(left, mid - 1)\n    return helper(0, len(nums) - 1)',
    },
  ],
};
/**
 * Fallback AI suggestions used when no problem-specific suggestions are defined.
 * @constant {Object[]}
 */
export const DEFAULT_AI_SUGGESTIONS = [
  {
    label: 'Initialize result variable',
    detail: 'AI Suggestion',
    insertText: 'result = None',
  },
  {
    label: 'Iterate over input',
    detail: 'AI Suggestion',
    insertText: 'for item in data:\n        pass',
  },
];
export const AVAILABLE_LANGUAGES = [
  { key: 'python', label: 'Python' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'java', label: 'Java' },
  { key: 'c', label: 'C' },
];

export const DEFAULT_BOILERPLATE = {
  python: 'def solution():\n    # Write your solution here\n    pass\n',
  javascript: 'function solution() {\n    // Write your solution here\n\n}\n',
  java: 'class Solution {\n    public void solution() {\n        // Write your solution here\n    }\n}\n',
  c: '#include <stdio.h>\n\nvoid solution() {\n    // Write your solution here\n}\n',
};

export const DEFAULT_SUGGESTIONS = {
  python: { correct: '', distractors: [''] },
  javascript: { correct: '', distractors: [''] },
  java: { correct: '', distractors: [''] },
  c: { correct: '', distractors: [''] },
};
