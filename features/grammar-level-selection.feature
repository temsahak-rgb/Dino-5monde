@implemented @grammar
Feature: Grammar level selection
  Learners must be able to choose a supported grammar level and return to it
  from a lesson without relying on a hidden navigation convention.

  Scenario: The grammar catalog exposes every supported level
    Given the supported grammar levels
    Then the grammar levels are "A1, A2, B1, B2, C1"

  Scenario Outline: A grammar lesson belongs to the level encoded in its identifier
    Given the grammar lesson identifier "<lessonId>"
    When its owning grammar level is resolved
    Then the owning grammar level is "<level>"

    Examples:
      | lessonId | level |
      | A1-G-003 | A1    |
      | B2-G-010 | B2    |
      | C1-G-001 | C1    |
