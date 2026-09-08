@implemented @progress
Feature: Cross-device lesson progress
  Signed-in learners should keep their most advanced Grammar and Travel
  progress when they continue learning on another device.

  Scenario: A stale device cannot erase completed work
    Given one device completed sections "intro, exercise" of a lesson
    And another device reports section "summary" as in progress
    When both lesson progress records are merged
    Then the lesson remains completed
    And the completed sections are "intro, exercise, summary"
