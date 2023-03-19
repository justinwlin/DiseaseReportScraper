import pandas as pd

# Read in events.csv and outbreaks.csv
events = pd.read_csv("./data/events.csv")
outbreaks = pd.read_csv("./data/outbreaks_deduped.csv")

# Merge the two dataframes based on the "eventID" column
merged_df = pd.merge(outbreaks, events, on="eventID")

# Add the "event-" prefix to all the columns from events.csv
merged_df.rename(columns=lambda x: "event-" + x if x in events.columns else "outbreak-" + x, inplace=True)

# Print the length of rows before deduplication
print(f"Rows before deduplication: {len(merged_df)}")

# Drop duplicates based on all columns except "createdDate"
merged_df.drop_duplicates(subset=merged_df.columns.difference(["createdDate"]), keep="last", inplace=True)

# Print the length of rows after deduplication
print(f"Rows after deduplication: {len(merged_df)}")

# Write the resulting merged dataframe to a new CSV file
merged_df.to_csv("./data/merged.csv", index=False)

# Print a message indicating that the file was saved successfully
print("Merged data saved to 'merged.csv'")
