import pandas as pd

# Read in events.csv and outbreaks.csv
events = pd.read_csv("./data/events.csv")
outbreaks = pd.read_csv("./data/outbreaks.csv")

# Merge the two dataframes based on the "eventID" column
merged_df = pd.merge(outbreaks, events, on="eventID")

# Add the "event-" prefix to all the columns from events.csv
merged_df.rename(columns=lambda x: "event-" + x if x in events.columns else "outbreak-" + x, inplace=True)

# Write the resulting merged dataframe to a new CSV file
merged_df.to_csv("./data/merged.csv", index=False)

# Print a message indicating that the file was saved successfully
print("Merged data saved to 'merged.csv'")
