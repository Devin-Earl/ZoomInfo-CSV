import os
import logging
from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# Load credentials from .env file
load_dotenv()
username = os.getenv('USERNAME')
password = os.getenv('PASSWORD')

# Set the path to the chromedriver executable
chromedriver_path = "/usr/local/bin/chromedriver"

# Set the options to run headless
chrome_options = webdriver.ChromeOptions()
#chrome_options.add_argument("--headless")

# Create a new instance of the Chrome driver
driver = webdriver.Chrome(executable_path=chromedriver_path, options=chrome_options)

# Navigate to zoominfo.com
driver.get("https://login.zoominfo.com/")

# Wait for the page to load
driver.implicitly_wait(10)

# Find the email and password input fields and fill them in with the credentials
email_input = driver.find_element(By.NAME, "username")
logging.info(f"Filling in email input with: {username}")
email_input.send_keys(username)

password_input = driver.find_element(By.NAME, "password")
logging.info("Filling in password input")
password_input.send_keys(password)

submit_button = driver.find_element(By.ID, "btn-login")
logging.info("Clicking submit button")
submit_button.click()

# Wait for the dashboard page to load
driver.implicitly_wait(10)

# Do whatever you need to do on the dashboard page here

# Close the browser
driver.quit()
