Feature: Home page

  Scenario: View the home page
    Given I access the home page
    Then I should see the game title FLIP 7
    And I should see the Play button
    And I should see the How to play section

  Scenario: Navigate to game setup from home
    Given I access the home page
    When I click the Play button
    Then I should be on the game page
    And I should see the game setup form
