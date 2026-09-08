@profile @progress
Feature: Daily practice rhythm
  Learners can understand today's effort and their current practice streak.

  @implemented
  Scenario: Show a three-day streak and today's remaining goal
    Given a learner practiced on three consecutive days including today
    And the learner completed two exercises today
    When the daily practice summary is prepared for a three-exercise goal
    Then the profile shows a three-day streak and one exercise remaining
