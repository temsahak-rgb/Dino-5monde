@archive @progress
Feature: Learning archive
  Learners can reopen completed lessons from a durable local-first history.

  @implemented
  Scenario: Keep only completed lessons with real destinations
    Given the learner has one completed lesson and one lesson in progress
    When the learning archive is prepared from the current catalog
    Then the archive contains only the completed lesson with its direct link
